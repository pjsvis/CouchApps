#! /usr/bin/env python
#
# twindxatt.py - TapirWiki full text indexing of attachtments with xappy, xapian
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

# As attachment indexer is directly called there is no need for a changes processor and hence no need for the couchfti indexer.
# we can talk to xappy directly.

import xappy
import simplejson
import os
import tempfile
import subprocess
import sys
import couchdb
import logging
from optparse import OptionParser, make_option
import re, zipfile
import StringIO


def external(commandlisthead, commandlisttail, db, docid, filename):
    logging.debug("Entering external function now..")
    # first create a temporary file
    fd, path=tempfile.mkstemp()
    # we need to close it
    # os.close(fd)
    # write the pdf file to the temporary file
    # fd.write(db.get_attachment("FrontPage","asiaweb2130.pdf").read())
    os.write(fd, db.get_attachment(docid,filename).read())
    os.close(fd)
    commandlist=commandlisthead
    commandlist.append(path)
    commandlist.extend(commandlisttail)
    # now call the converter
    p=subprocess.Popen(commandlist,stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    data=p.stdout.read()
    errors=p.stderr.read()
    logging.debug("Errors from external are %s", errors)
    # now get rid of temp file
    os.unlink(path)
    return data
  
def pdftotext(db, docid, filename):
    return external(['pdftotext','-q','-enc','UTF-8'],['-'],db, docid, filename)

def mswordtotext(db, docid, filename):
    return external(['antiword'],[],db,docid,filename)

def msexceltotext(db,docid,filename):
    data = external(['xls2csv'],[],db,docid,filename)
    data = data.replace(u',', u' ').replace(u'"', u' ')
    return data

def mspptotext(db,docid,filename):
    return external(["catppt","-dutf-8"],[],db,docid,filename)

def rtftotext(db,docid,filename):
    logging.debug("in rtftotext routine")
    return external(["catdoc"],[],db,docid,filename)


rx_stripxml = re.compile("<[^>]*?>", re.DOTALL|re.MULTILINE)
def oototext(db, docid, filename):
# this routine borrowed from MoinMoin but changed to work with StringIO
    try:
        data=zipfile.ZipFile(StringIO.StringIO(db.get_attachment(docid,filename).read())).read("content.xml")
        data = " ".join(rx_stripxml.sub(" ", data).split())
    except (zipfile.BadZipfile, RuntimeError), err:
        logging.error("%s [%s]" % (str(err), filename))
        data = ""
    try:
        data = data.decode('utf-8')
    except UnicodeDecodeError:
        # protected with password? no valid OpenDocument file?
        data = u''
    return data



# dictionary of mime, converter functions
mimefilter = {               
              "application/pdf" : pdftotext, 
              "application/x-pdf" : pdftotext,
              "application/vnd.oasis.opendocument.text" : oototext,
              "application/vnd.oasis.opendocument.text-master" : oototext,
              "application/vnd.oasis.opendocument.text-web" : oototext,
              "application/vnd.oasis.opendocument.graphics" : oototext,
              "application/vnd.oasis.opendocument.presentation" : oototext,
              "application/vnd.oasis.opendocument.spreadsheet" : oototext,
              "application/vnd.oasis.opendocument.formula" : oototext,
              "application/vnd.sun.xml.base" : oototext,
              "application/msword" : mswordtotext,
              "application/msexcel" : msexceltotext,
              "application/mspowerpoint" : mspptotext,
              "application/rtf":rtftotext
             }



def factory(db, docid, fname, mime): # db is a couchdb database object, docid points to the attachment (doc(_id)+'/'+filename)
    if mimefilter.has_key(mime):
        logging.debug("in the factory now")
        data=mimefilter[mime](db, docid, fname)
        if len(data)>1:
            logging.debug("making a new index doc length data to be indexed %i", len(data))
            doc=xappy.UnprocessedDocument()
            doc.id=os.path.join(docid,fname)
            doc.fields.append(xappy.Field('plaintxt', data))
            return doc
            

   
attidx = { 
                           'fields'   : [
                                         (['plaintxt', xappy.FieldActions.INDEX_FREETEXT], {'language':'en'}),
					 (['plaintxt', xappy.FieldActions.STORE_CONTENT], {})
                                        ],
                           'path'     : "tapiratt.idx"
                         
         }




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
    couch=couchdb.Server(url)
    connections = {} #these hold the xappy index connections
    try:
        for quert in queries():
            doc = quert.get('query', {}).get('id', '')
            fname = quert.get('query', {}).get('fn', '')
            mime = quert.get('query', {}).get('me', '')
            action = quert.get('query', {}).get('act', '')
            qdbn=quert.get('info',{}).get('db_name','')
            logging.debug("received query doc=%s fname=%s mime=%s action=%s", doc,fname,mime,action)
            if qdbn in exclude:
                continue
            if qdbn not in connections:
                logging.debug("opening index connection for database %s index %s", qdbn, attidx['path'])
                connections[qdbn] = xappy.IndexerConnection(os.path.join(dir,qdbn,attidx['path']))
                logging.debug("indexer connection created. path is: %s", os.path.join(dir,qdbn,attidx['path']))
                for args, kwargs in attidx['fields']:
                    connections[qdbn].add_field_action(*args, **kwargs)
                    logging.debug("added action for field with args %r and kwargs %r", args, kwargs)
            if action == "update": #if doc does not exist it is added so both for add and update
                db=couch[qdbn]
                logging.debug('Handling update for doc %s attachment %s', doc, fname)
                connections[qdbn].replace(factory(db, doc, fname, mime))
            if action == "delete":
                docid=os.path.join(doc,fname)
                logging.debug('Handling delete for %s', docid)
                connections[qdbn].delete(docid)
            connections[qdbn].flush()
            # We need to send something back
            send({'code': 200, 'json': {}, 'headers': {}})
    except:
        for database, index in connections:
            logging.debug("flushing and closing index: %s", database)
            index.flush()
            index.close()

         

if __name__ == '__main__':
    options = [
        make_option('-d', '--dir', dest='dir', metavar="DIRECTORY", default="./xappy", 
            help="Directory in which to store xapian/xappy databases. [%default]"),
        make_option('-u', '--url', dest='url', metavar="URL", default="http://localhost:5984",
            help="URL of the couchdb server. [%default]"),
        make_option('-e', '--exclude', dest='exclude', metavar='DB_NAME', default=[],
            help="Exclude a database from indexing. Can be used multiple times."),
        make_option('-l', '--log', dest='log', metavar="FILE", default='./xappy/twindxatt.log',
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
    logging.basicConfig(filename=opts.log, level=logging.DEBUG, format="%(levelname)s %(message)s")
    try:
        main(os.path.abspath(opts.dir), opts.url, opts.exclude)
    except:
        print("Attachment Indexer shutting down due to high stress. Relaxation needed.")




