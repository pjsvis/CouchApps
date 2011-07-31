var couchapp = require('couchapp'), 
    path = require('path');

ddoc = 
  { _id:'_design/app',
  rewrites : 
    [ {from:"/", to:'index.html'},
      {from:"/api/lists", to: "_view/lists"},
      {from:"/api/*", to:'../../*'},
      {from:"/*", to:'*'}
    ]
  };

ddoc.views = {
    containers: {
        map: function(doc) {
            if( (doc.type == "folder" || doc.type == "list") && (doc.ancestors && doc.ancestors.length) ) {
                for(var parent in doc.ancestors) {
                    if(doc.ancestors[parent]) {
                        emit(doc.ancestors[parent], doc);
                    }
                }
            }
        }
    },
    tasks: {
        map: function(doc) {
            if( (doc.type == "task") && (doc.ancestors && doc.ancestors.length) ) {
                for(var parent in doc.ancestors) {
                    if(doc.ancestors[parent]) {
                        emit(doc.ancestors[parent], doc);
                    }
                }
            }
        }
    }      
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {     
    throw "Only admin can delete documents on this database.";
  } 
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;