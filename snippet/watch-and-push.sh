#!/bin/sh
rvm use jruby
#ruby --ng-server --server -J-Xmx1024m & 
while inotifywait couchapp -r -e  modify  --exclude '.*swp|.git' .; do
	echo "pushing changed to couch!"
	# couchapp push couchapp http://localhost:5984/snippets
	coffeeapp push couchapp http://localhost:5984/snippets
	#ruby --ng /home/ronen/.rvm/gems/jruby-1.5.6/bin/cucumber
	ruby /home/ronen/.rvm/gems/jruby-1.5.6/bin/cucumber
done
