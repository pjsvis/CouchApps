#! /usr/bin/env python
#
# twquery.py - TapirWiki full text indexing with couchfti, xappy, xapian
# Copyright (C) 2010 Jeroen Vet jeroen.vet@gmail.com (on changes only)
# based on couchdb-xapian-query (C) Paul J. Davis 
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
# with this program; if not, write to the Free Software Foundati

import xappy
import xapian
import simplejson
import os
import sys
import couchdb
import logging
from optparse import OptionParser, make_option

# incorporated query, search from couchfti here to make installation simpler. 

# query
"""
FTI query string tokenizer/untokenizer.
"""

from pyparsing import CharsNotIn, Group, oneOf, Optional, QuotedString, \
        Suppress, White, Word, ZeroOrMore, FollowedBy


# Setup the parser, for internal use only.
_control_chars = ' !"$%^&*()-=+[]{};\'#:@~,./<>?'
_operators = '= < > <= >= != ~ =* *='
_safe_word = CharsNotIn(_control_chars) + ~FollowedBy(oneOf(_operators))
_field_name = Word('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_')
_field_value = _safe_word | QuotedString('"')
_field = Group(_field_name + oneOf(_operators) + _field_value).setResultsName('field')
_term = Group(_safe_word | QuotedString('"')).setResultsName('term')
_order = Group('{' + Optional('-') + _field_name + '}').setResultsName('order')
_query = Optional(_term | _field | _order) + ZeroOrMore(Suppress(White()) + (_term | _field | _order))
_parser = _query.parseString


def tokenize(q):
    """
    Tokenize a query string into a sequence of (type, data) tuples where type
    and data are one of the following:

        'term', <term text>
        'field', (<name>, <operator>, <value>)
        'order', <name>, <ascending>
    """
    def gen():
        if not isinstance(q, unicode):
            raise TypeError("'q' must be unicode")
        for i in _parser(q):
            if i.getName() == 'term':
                yield 'term', i[0]
            elif i.getName() == 'field':
                yield 'field', tuple(i)
            elif i.getName() == 'order':
                if i[1] == '-':
                    yield 'order', (i[2], False)
                else:
                    yield 'order', (i[1], True)
    if not q:
        return []
    return list(gen())


def untokenize(q):
    """
    Serialize a sequence of tokens into a string.
    """
    return unicode(' '.join(_untokenize(q)))


def _untokenize(q):
    for name, data in q:
        if name == 'term':
            if _needs_quoting(data):
                yield '"%s"' % data
            else:
                yield data
        elif name == 'field':
            name, operator, value = data
            if _needs_quoting(value):
                yield '%s%s"%s"' % tuple(data)
            else:
                yield '%s%s%s' % tuple(data)
        elif name == 'order':
            if data[1]:
                yield '{%s}' % data[0]
            else:
                yield '{-%s}' % data[0]


def _needs_quoting(s):
    return not ''.join(_safe_word.parseString(s)[0]) == s

# search

"""
Index/search facility for CouchDB.
"""

class Searcher(object):
    """
    Search a set of indexes for matching documents.
    """

    def __init__(self, db, path, indexes):
        self.__db = db
        self.__path = path
        self.__indexes = indexes

    def search_docs(self, index, query, skip, max):
        rows = self.db.view('_all_docs', include_docs=True,
                            keys=self.search_docids(index, query, skip, max))
        return [row.doc for row in rows]

    def search_docids(self, index, query, skip, max):
        return [r.id for r in self.search(index, query, skip, max)]

    def search(self, index, query, skip, max):
        config = self.__indexes[index]
        try:
            conn = xappy.SearchConnection(os.path.join(self.__path, config['path']))
        except xapian.DatabaseOpeningError, e:
            logging.error(e)
            return None
        # Tokenize the query
        q = list(tokenize(query))
        # Build a phrase and a list of attrs
        terms = [i[1].encode('utf-8') for i in q if i[0] == 'term']
        attrs = [i[1] for i in q if i[0] == 'field']
        order = ([i[1] for i in q if i[0] == 'order'] or [None])[0]
        # Build a xapian query.
        query = conn.query_all()
        for term in terms:
            query = xapian.Query(xapian.Query.OP_AND, query, xapian.Query(term.lower()))
        for field, op, value in attrs:
            func = QUERY_FACTORIES[op]
            query = xapian.Query(xapian.Query.OP_AND, query, func(conn, field, value))
        if not order:
            sortby = None
        else:
            sortby = '-+'[order[1]] + order[0]
        # Run and return the query.
        return conn.search(query, skip, skip+max, sortby=sortby)


def query_eq(conn, field, value):
    return conn.query_field(field, value)


def query_prefix(conn, field, value):
    return _query_range(conn, field, value, value+u'\u9999')


def query_gteq(conn, field, value):
    return _query_range(conn, field, value, None)


def query_lteq(conn, field, value):
    return _query_range(conn, field, None, value)


def _query_range(conn, field, begin, end):
    return conn.query_range(field, begin, end)


QUERY_FACTORIES = {'=': query_eq,
                   '=*': query_prefix,
                   '>=': query_gteq,
                   '<=': query_lteq}

# end incorporation


indexes= { 'wikipageidx':{ 
                           'path'     : "tapirwiki.idx",
                         },
           'attindx': { 'path' : "tapiratt.idx" }
         }

couch=couchdb.Server()


def queries():
    line = sys.stdin.readline()
    while line:
        if not line:
            return
        obj = simplejson.loads(line)
        yield obj
        line = sys.stdin.readline()

def send(data):
       sys.stdout.write(simplejson.dumps(data))
       sys.stdout.write('\n')
       sys.stdout.flush()

def main(dir, url, exclude):
    searchers = {}
    for quert in queries():
         qs = quert.get('query', {}).get('q', '')
         suml = int(quert.get('query', {}).get('sl', ''))
         perp = int(quert.get('query', {}).get('pp', ''))
         skip = int(quert.get('query', {}).get('sk', ''))
         att = quert.get('query', {}).get('att','')
         logging.debug("received query, query=%s summary=%i per page=%i skip=%i attachments=%s", qs, suml, perp, skip, att)
         qdbn=quert.get('info',{}).get('db_name','')
         if qdbn not in searchers:
             qdb=couch[qdbn]
             searchers[qdbn] = Searcher(qdb, os.path.join(dir, qdbn), indexes)
         if att=="":
             ret = searchers[qdbn].search('wikipageidx',unicode(qs),skip,skip+perp) # we are getting back xappy search results 
             cnt=1
             reta=[{'totmatches':ret.matches_estimated}]
             for result in ret:
                 reta.append({})      
                 reta[cnt]['rank']=result.rank
                 reta[cnt]['_id']=result.id
                 reta[cnt]['edited_by']=result.data['edited_by'][0] 
                 reta[cnt]['edited_on']=result.data['edited_on'][0]
                 if result.data.has_key('attachdescr'):
                     reta[cnt]['attachdescr']=result.summarise('attachdescr', 200)
                 logging.debug("The action list looks like this %r", result._results._conn._field_actions)
                 reta[cnt]['summary']=result.summarise('body', maxlen=suml)
                 cnt=cnt+1
         else: #search attachments
             logging.debug("entering the attachment routine!") 
             ret = searchers[qdbn].search('attindx',unicode(qs),skip,skip+perp) # we are getting back xappy search results 
             cnt=1
             reta=[{'totmatches':ret.matches_estimated}]
             for result in ret:
                 reta.append({})      
                 reta[cnt]['rank']=result.rank
                 reta[cnt]['_id']=result.id
                 logging.debug("found document %s", result.id)
                 logging.debug("The search result looks like this %r", result)
                 logging.debug("The action list looks like this %r", result._results._conn._field_actions)
                 reta[cnt]['summary']=result.summarise('plaintxt', maxlen=suml)
                 cnt=cnt+1   
         send({'code': 200, 'json': reta, 'headers': {}})

       
if __name__ == '__main__':
    options = [
        make_option('-d', '--dir', dest='dir', metavar="DIRECTORY", default="./xappy",
            help="Directory in which xapian databases are stored. [%default]"),
        make_option('-u', '--url', dest='url', metavar="URL", default="http://localhost:5984",
            help="URL of the couchdb server. [%default]"),
        make_option('-e', '--exclude', dest='exclude', metavar='DB_NAME', default=[],
            help="Exclude a database from indexing. Can be used multiple times."),
        make_option('-l', '--log', dest='log', metavar="FILE", default='./xappy/twquery.log',
            help="Name of the log file to write to."),
    ]
    parser = OptionParser("usage: %prog [OPTIONS]", option_list=options)
    opts, args = parser.parse_args()
    if len(args) != 0:
        print "Unrecognized arguments: %s" % ' '.join(args)
        parser.print_help()
        exit(-1)
    logging.basicConfig(filename=opts.log, level=logging.DEBUG, format="%(levelname)s %(message)s")
    logging.debug("Started search routine")
    try:
        main(os.path.abspath(opts.dir), opts.url, opts.exclude)
    except:
        logging.exception("Querying shutting down due to high stress. Relaxation needed.")


