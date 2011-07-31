TAPIRWIKI FULL TEXT INDEXING WITH XAPPY/XAPIAN 

To enable full text indexing with TapirWiki please do the following:

1. Create the directory /opt/tapirsearch (or any other directory of your choice as long as it corresponds to the local.ini of step 9). Set owner to couchdb.

2. Copy the *.py files in this directory to /opt/tapirsearch. Set owner of these files to couchdb. 
One way of accomplishing this which is especially useful when couchdb is running remotely, is by issuing below command in a terminal to the server while in
the /opt/tapirsearch directory: 

$ curl -O http://localhost:5984/name-of-database/_design/tapir/python/twindex.py 

and repeat that for twindxatt.py and twquery.py (you must have curl installed on the server for this to work).

3. Install the Xapian libraries through your package manager if not on your system yet. (on ubuntu sudo apt-get install python-xapian)

4. Install easy_install if not on your system yet (on Ubuntu: sudo apt-get install python-setuptools python-dev build-essential).

5. Install the dependencies:

$ sudo easy_install couchDB 

$ sudo easy_install xappy

$ sudo easy_install pyparsing

6. To be able to index/search PDF documents you must have the utility pdftotext installed (most linux distributions have this included in the standard distribution, if not on ubuntu you can do: sudo apt-get install poppler-utils)

7. MSWord indexing/searching requires the program antiword installed.

8. Indexing/searching Excel, PowerPoint or RTF files requires catdoc installed.

9. Update local.ini of CouchDB (probably in /etc/couchdb) by adding the below lines between the dashes (please change the directory names appropriately):

-------------------------------------

[external]
fti=/usr/bin/python /opt/tapirsearch/twquery.py -d /opt/tapirsearch/xappy -l /opt/tapirsearch/xappy/twquery.log
aix=/usr/bin/python /opt/tapirsearch/twindxatt.py -d /opt/tapirsearch/xappy -l /opt/tapirsearch/xappy/indexatt.log

[httpd_db_handlers]
_fti = {couch_httpd_external, handle_external_req, <<"fti">>}
_aix = {couch_httpd_external, handle_external_req, <<"aix">>}


[update_notification]
indexer = /usr/bin/python /opt/tapirsearch/twindex.py -d /opt/tapirsearch/xappy -l /opt/tapirsearch/xappy/twindex.log

--------------------------------------

Note: the database directory ('xappy' as suggested above) and log files need not exist (they will be created programmatically), if however you want to put the logfiles in another directory than the database directory, that directory must exist already and the user 'couchdb' must have write access to that directory.

10. Add "Search" to mainMenu on the TAPIRWIKISETTINGS page of each existing database you want to enable search. You can also add it to systempages/TAPIRWIKISETTINGS.json in your couchapp directory to ensure that it will appear in new databases you couchapp push the application to.

11. Enable attachment indexing in TAPIRWIKISETTING (as above you can enable it in TAPIRWIKISETTINGS.json as well)

