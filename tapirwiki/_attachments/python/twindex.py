#! /usr/bin/env python
#
# twindex.py - TapirWiki full text indexing with couchfti, xappy, xapian
# Copyright (C) 2010 Jeroen Vet jeroen.vet@gmail.com (on changes only)
# based on couchdb-xapian-indexer (C) Paul J. Davis 
# adapted for use with couchfti (which uses Xappy to manage Xapian indices)
# to enable advanced full text indexing and search for TapirWiki
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.



import xappy
import xapian
import couchdb
import time
from optparse import OptionParser, make_option
import logging
import os
import sys
import simplejson

#Incorporated index, change processor from couchfti, couchutil here to make installation simpler

class ChangesProcessor(object):
    """
    Utility class to process updates in a CouchDB database since some known
    point in the database's history.

    When called, the processor uses the database's _all_docs_by_seq view to
    walk the changes in sequence. Progress is stored in the statefile to make
    future calls efficient.

    By default, the processor does nothing. Subclass it and override
    handle_update and handle_delete. You can also override at the
    handle_changes level if necessary.
    """

    def __init__(self, db, statefile, batch_size=25, forever=False, poll_delay=None):
        self.db = db
        self.__statefile = statefile
        self.batch_size = batch_size
        self.forever = forever
        self.poll_delay = poll_delay

    def __call__(self):
        if self.forever and self.poll_delay:
            self.run_forever_poll()
        elif self.forever:
            self.run_forever()
        else:
            self.run_once()

    def run_forever_poll(self):
        while True:
            self.run_once()
            time.sleep(self.poll_delay)

    def run_forever(self):
        while True:
            changes_resource = self.db.resource('_changes')
            startkey = self._read_startkey()
            args = {'feed': 'longpoll'}
            if startkey is not None:
                args['since'] = startkey
            headers, changes = changes_resource.get(**args)
            # We could get receive a lot more changes than the batch_size here,
            # i.e. if we haven't watched the database for a while (or ever), so
            # we need to split into batch_size'd chunks to avoid consuming lots
            # of memory.
            for batch in ibatch(changes['results'], self.batch_size):
                # We need a list to a) avoid consuming the iterator, and b) to
                # get the 'seq' from the last item.
                batch = list(batch)
                self.handle_changes([result['id'] for result in batch])
                # We know we've handled all of the changes in this batch so
                # update the state.
                self._write_startkey(batch[-1]['seq'])
            # We got to the end of the _changes results. Update the state one
            # last time.
            self._write_startkey(changes['last_seq'])

    def run_once(self):
        while True:
            startkey = self._read_startkey()
            logging.debug('Reading updates from %r', startkey)
            args = {'limit': self.batch_size}
            if startkey is not None:
                args['startkey'] = startkey
            rows = list(self.db.view('_all_docs_by_seq', **args))
            if not rows:
                break
            self.handle_changes([row['id'] for row in rows])
            self._write_startkey(rows[-1]['key'])

    def handle_changes(self, ids):
        for row in self.db.view('_all_docs', keys=ids, include_docs=True):
            if row.doc is None:
                self.handle_delete(row.key)
            else:
                self.handle_update(row.doc)

    def handle_delete(self, docid):
        logging.debug('Ignoring deletion: %s', docid)

    def handle_update(self, doc):
        logging.debug('Ignoring update: %s@%s', doc['_id'], doc['_rev'])

    def _read_startkey(self):
        try:
            return int(open(self.__statefile, 'rb').read())
        except IOError:
            return None

    def _write_startkey(self, startkey):
        open(self.__statefile, 'wb').write(str(startkey))


def ibatch(iterable, size):
    sourceiter = iter(iterable)
    while True:
        batchiter = itertools.islice(sourceiter, size)
        yield itertools.chain([batchiter.next()], batchiter)


class Indexer(ChangesProcessor):
    """
    ChangesProcessor handler for managing a set of HyPy indexes.
    """

    def __init__(self, db, path, indexes, **kw):
        ChangesProcessor.__init__(self, db, os.path.join(path, 'statefile'), **kw)
        self.__path = path
        self.__indexes = indexes
        self.__open_indexes = {}
        if not os.path.exists(path):
            os.makedirs(path)

    def handle_changes(self, ids):
        try:
            return super(Indexer, self).handle_changes(ids)
        finally:
            for path, index in self.__open_indexes.iteritems():
                logging.debug("flushing and closing index: %s", path)
                index.flush()
                index.close()
            self.__open_indexes.clear()

    def index(self, config):
        index = self.__open_indexes.get(config['path'])
        if index is None:
            logging.debug("opening index: %s", config['path'])
            index = xappy.IndexerConnection(os.path.join(self.__path, config['path']))
            for args, kwargs in config['fields']:
                index.add_field_action(*args, **kwargs)
            self.__open_indexes[config['path']] = index
        return index

    def handle_delete(self, docid):
        logging.debug('Handling delete for %s', docid)
        for name, config in self.__indexes.iteritems():
            self.index(config).delete(docid)
            logging.info('Removed %s from %s index', docid, name)

    def handle_update(self, doc):
        logging.debug('Handling update for %s@%s', doc['_id'], doc['_rev'])
        for name, config in self.__indexes.iteritems():
            classification = config['classifier'](doc)
            if classification is None:
                continue
            factory = config['factories'].get(classification)
            if factory is None:
                continue
            logging.info('Adding %s@%s to %s index as %r', doc['_id'], doc['_rev'], name, classification)
            # jv added to depbug
            print doc
            self.index(config).replace(factory(self.db, doc))

## end incorporation

def wikipageclassifier(doc):
    if 'type' in doc:
        if doc['type']=='page':
            return "wikipage"
    return None

def wikipagefactory(db, cdbdoc):
    logging.debug("twindex.py: entering the chocolate factory now!")
    doc=xappy.UnprocessedDocument()
    doc.id=cdbdoc['_id']
    doc.fields.append(xappy.Field('body', cdbdoc['body']))
    doc.fields.append(xappy.Field('edited_by', cdbdoc['edited_by']))
    dt=time.strptime(cdbdoc['edited_on'][:24],"%a %b %d %Y %H:%M:%S")
    dts=time.strftime("%Y-%m-%d",dt)
    doc.fields.append(xappy.Field('edited_on', dts))
    combined=""
    if cdbdoc.has_key('attachdescr'): 
        logging.debug("twindex.py: attachment descriptions have been detected: %r", cdbdoc['attachdescr'])   
        for fn in cdbdoc['attachdescr']:
            combined+=cdbdoc['attachdescr'][fn]
    if combined!="":
        doc.fields.append(xappy.Field('attachdescr', combined))
        logging.debug("Added the following description to xappy doc: %s", combined)
    logging.debug("about to return unprocessed document %s", doc.id)         
    return doc 

   
indexes= { 'wikipageidx':{ 'classifier': wikipageclassifier, # types of doc in index is determined by the classifier
                           'factories': { 'wikipage' : wikipagefactory  # each type of doc has its own factory
                                         }, 
                           'fields'   : [
                                         (['body', xappy.FieldActions.INDEX_FREETEXT], {'language':'en'}),
					 (['body', xappy.FieldActions.STORE_CONTENT], {}),
                                         (['edited_by', xappy.FieldActions.INDEX_EXACT], {}),
                                         (['edited_by', xappy.FieldActions.STORE_CONTENT], {}),
                                         (['edited_on', xappy.FieldActions.SORTABLE], {'type':'date'}),
                                         (['edited_on', xappy.FieldActions.STORE_CONTENT], {}),
                                         (['attachdescr', xappy.FieldActions.INDEX_FREETEXT], {'language':'en'}),
                                         (['attachdescr', xappy.FieldActions.STORE_CONTENT], {})
                                        ],
                           'path'     : "tapirwiki.idx"
                         }
         }

def updates():
    line = sys.stdin.readline()
    while line:
        if not line:
            return
        obj = simplejson.loads(line)
        yield obj
        line = sys.stdin.readline()

def main(dir, url, exclude):
    couch=couchdb.Server(url)
    indices = {} #these indices hold the (xappy) indexer objects
    for update in updates():
        logging.debug("Processing change %r", update)
        db = couch[update['db']]
        if db.name in exclude:
            continue
        if db.name not in indices:
            logging.debug("creating new index for database %s on path %s", db.name, os.path.join(dir, db.name))
            indices[db.name] = Indexer(db, os.path.join(dir, db.name), indexes, forever=False) # indexes refer to index configurations
        indices[db.name]()

if __name__ == '__main__':
    options = [
        make_option('-d', '--dir', dest='dir', metavar="DIRECTORY", default="./xappy", 
            help="Directory in which to store xapian/xappy databases. [%default]"),
        make_option('-u', '--url', dest='url', metavar="URL", default="http://localhost:5984",
            help="URL of the couchdb server. [%default]"),
        make_option('-e', '--exclude', dest='exclude', metavar='DB_NAME', default=[],
            help="Exclude a database from indexing. Can be used multiple times."),
        make_option('-l', '--log', dest='log', metavar="FILE", default='./xappy/twindex.log',
            help="Name of the log file to write to."),
    ]
    parser = OptionParser("usage: %prog [OPTIONS]", option_list=options)
    opts, args = parser.parse_args()
    if len(args) != 0:
        print "Unrecognized arguments: %s" % ' '.join(args)
        parser.print_help()
        exit(-1)
    if not os.path.isdir(opts.dir):
        os.mkdir(opts.dir)
    logging.basicConfig(filename=opts.log, filemode='w', level=logging.DEBUG, format="%(levelname)s %(message)s")
    try:
        main(os.path.abspath(opts.dir), opts.url, opts.exclude)
    except:
        print("Indexer shutting down due to high stress. Relaxation needed.")



