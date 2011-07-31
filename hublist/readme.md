# Hub List
Hub List is an [open source GTD style productivity app](http://hublistapp.com) written entirely in JavaScript using [Ext JS 4](http://www.sencha.com/products/extjs/). It's a [CouchApp](http://couchapp.org/page/what-is-couchapp) which means it can be served directly from any CouchDB instance without the need for a separate server side application stack!

![Screenshots](http://dl.dropbox.com/u/946636/HL-Readme-Screnshots.png)

## Status
The app is currently under heavy development and not ready for situations where data loss will ruin your day. I'm in the process of replicating the functionality from the previous version of Hub List which was built with Ext JS 3.x. As soon as the core functionality is complete the app will be ready for everyday use. The first screenshot is what the app currently looks like. The second and third screenshots are where it's headed.

## App Requirements
- [CouchDB](http://www.couchbase.com/downloads) (1.1+)
- A modern web browser

## Deployment Requirements
To start using Hub List you'll need these tools to push the application code into an instance of CouchDB. These don't have be installed on the same machine as your CouchDB instance as long as they can access the CouchDB instance where you want Hub List installed.

- [NodeJS](https://github.com/joyent/node) (0.4.0+)
- [node.couchapp.js](https://github.com/mikeal/node.couchapp.js)

## Installing Hub List
1. Create a database on your instance of CouchDB. You can name the database anything.  
```
curl -X PUT http://127.0.0.1:5984/hublist
``` 

2. clone this repo  
```
git clone  https://github.com/rawberg/Hub-List_GTD-Productivity Hub-List
```

3. push the code into the database you created (requires [node.couchapp.js](https://github.com/mikeal/node.couchapp.js))  
```
cd Hub-List
```  
```
couchapp push couchapp.js http://127.0.0.1:5984/hublist 
```

4. open the index.html file in your browser and enjoy!  
```
http://127.0.0.1:5984/hublist/_design/app/index.html
```

## Upgrading Hub List
1. Pull the latest changes  
```
cd Hub-List 
```  
```   
git pull  
```

2. push the updated code into your database  
```
couchapp push couchapp.js http://127.0.0.1:5984/hublist 
```

## Wishlist
- Distribute CouchApps as native desktop applications.

I'd love to distribute native desktop versions of Hub List for Mac, Windows and Linux. If anyone has experience or a desire to hack the CouchDB source code and existing platform intallers so desktop versions of CouchDB could immediately launch into a CouchApp, let me know.

## Developer Contributions & Discussion
Contributions are welcome! To contribute code or design simply fork this repo and initiate a pull request when you're ready to merge. For best results get in touch via twitter [@hublistapp](http://twitter.com/#!/hublistapp) with questions. 

## License
The Hub List source is available under an open source or commercial license. The open source license is the [GPL v3 License](http://opensource.org/licenses/gpl-3.0.html). A commercial license is available for those interested in including Hub List source code in non-open source applications. Please [get in touch](http://twitter.com/#!/hublistapp) for more information on the commercial license.

## Links
[API Documentation - http://apidocs.hublistapp.com](http://apidocs.hublistapp.com) (powered by [JSDuck](https://github.com/nene/jsduck))   
[Main Website - http://hublistapp.com](http://hublistapp.com)  
[Development Blog - http://hublistapp.com/blog](http://hublistapp.com/blog)  
[End User Support & Feature Requests](http://getsatisfaction.com/nimbleapps)   
Twitter [@hublistapp](http://twitter.com/#!/hublistapp)  
