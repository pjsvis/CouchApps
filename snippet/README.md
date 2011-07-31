SnippetApp is the next logic step of couchfuse ;), mount your couchdb edit your snippets and publish them via SnippetApp. 

This application enables currently a read only view of the snippets (see [demo](http://narkisr.couchone.com/snippets/_design/snippets/tagcloud.html))


Installation:

	# Use couchdb 1.1/1.0 (older version replication fails)
	$ curl -X PUT http://localhost:5984/snippet-app
	$ curl http://localhost:5984/_replicate -d '{"source":"http://narkisr.cloudant.com/snippet-app-clean","target":"snippet-app"}' -H "Content-Type: application/json"
	# checkout http://localhost:5985/snippet-app/_design/snippets/tagcloud.html

	# creating snippets using couch-fuse
	$ mkdir mount_point && couchfuse -db snippet-app -path mount_point
	$ mkdir mount/snip-1 && touch mount_point/snip-1/snip-1.txt
        # Add properties to the json  {"Tags":"java","Created":"2008-03-17 11:49:49","Comment":"Cool snip","Language":"Java","Title":"snip-1"}
	$ vim mount_point/snip-1/snip-1.json
TBD:

* Deployment guide.
* Packaing (with couch-fuse).

Feel free to provide feedback.
