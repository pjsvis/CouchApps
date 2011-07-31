/**
 * @class HL.store.Containers
 * @extends Ext.data.TreeStore
 */
Ext.define('HL.store.Containers', {
    extend: 'Ext.data.TreeStore',
    autoLoad: false,
    //autoSync: true, // this broken, not being passed along to NodeStore config
    id: 'containersStore',       
    defaultRootId: 'rootcontainer',
         
    model: 'HL.model.Container',
    root: {
        leaf: true, // initial loading of data only works when this is true (might be a bug?)
        expanded: true, // needed for initial data loading (seems counter intuitive)
        parentId: null
    },
    nodeParam: 'key',
    
    constructor: function() {
        return this.callParent(arguments);
    },
    
    listeners: {
        move: function(tree, node, oldParent, newParent, index, options) {
            var updatedRecords = this.getUpdatedRecords();
            if(updatedRecords && updatedRecords.length > 0) {
                this.sync();
            }
        },
        /**
         * Makes sure records are not left marked as dirty
         * when a child record or the root record is updated
         * with data returned from the server.
         */        
        write: function(store, operation) {
            var updatedRecs = store.getUpdatedRecords();
            var opsRecs = operation.getRecords();

            opsRecs.forEach(function(record, index, allItems) {
                if(record.getId() === 'rootcontainer') {
                    var existingRoot = store.getRootNode();
                    existingRoot.set('_rev', record.data._rev);
                    existingRoot.endEdit(true);
                    existingRoot.commit(true);
                    //store.setRootNode(record); // alternative to above is just to update the root node
                } else if(record.parentNode.dirty) {
                    // we do this here because the childIds field of the parentNode
                    // gets flagged as modified and marked as dirty when the tree runs 
                    // replaceChild to update the node with data from the server
                    record.parentNode.commit(true);  
                }
                
                // check to see if this record is at the root
                // of the task tree so we can relay it's fields
                if(record.get('type') === 'list') {
                    var tasksStore = Ext.data.StoreManager.lookup('tasksStore');
                    var taskRoot = tasksStore.getRootNode();
                    if(taskRoot && (record.getId() === taskRoot.getId()) ) {
                        record.relayFields(taskRoot);
                    }
                }
            });
        }        
    }    
         
});
