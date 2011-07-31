/**
 * Models tasks in the application. A task can contain other tasks by
 * holding task {@link HL.model.Task#_id} vlaues in it's 
 * {@link HL.model.Task#childIds} field.
 *
 */
Ext.define('HL.model.Task', {
    extend: 'Ext.data.Model',
    idProperty: '_id',
    
    requires: ['HL.proxy.Task'],
    proxy: 'task',
    
    fields: [
        /**
         * @property {string} name label displayed in the
         * UI for this task.
         */    
        {name: 'name', type: 'string'},
        /**
         * @property {string} type type of container this
         * instance represents. Defaults to task.
         */        
        {name: 'type', type: 'string', defaultValue: 'task'},
        {name: 'index', type: 'int', defaultValue: null, persist: false},  // caused problems when not explicity set to false
        {name: 'depth', type: 'int', defaultValue: 0, persist: false}, // caused problems when not explicity set to false
        /**
         * @property {auto} _rev _rev sequence maintained by CouchDB,
         * plays a big role in replication and conflict resolution.
         */        
        {name: '_rev', type: 'auto', defaultValue: null, convert: function(value, record) {
            var pause = '';
            return value;
        }},
        /**
         * @property {string} parentId {@link HL.model.Task#_id}
         * of this task's parent in the task hierarchy.
         */                   
        {name: 'parentId',  type: 'string', convert: function(value, record) {
            if(value === "") {
                // attempt to look up the task tree store
                // so we can find the root node
                var tasksStore = Ext.data.StoreManager.lookup('tasksStore');
                if(tasksStore && tasksStore.getRootNode()) {
                    return tasksStore.getRootNode().getId();
                } else {
                    return value;
                }
            } else {
                return value;
            }
        }},
        /**
         * @property {array} childIds list of id 
         * values reprepesenting this task's children 
         * {@link HL.model.Task#_id} values.
         */          
        {name: 'childIds', type: 'auto', defaultValue:[]},  
        /**
         * @property {auto} checked maintains the state of the checkbox
         * that can be shown next to this task in the UI.
         */               
        {name: 'checked',   type: 'bool', defaultValue: false},     
        /**
         * @property {array} ancestors list of task {@link HL.model.Task#_id}
         * values and top most {@link HL.model.Container#_id} value
         * that are ancestors to this task in the hierarchy. 
         * Used when querying CouchDB to get a list of all tasks
         * that descend from a specific container.
         */                 
        {name: 'ancestors', type: 'auto', convert: function(value, record) {
            if(record.data.ancestors && (JSON.stringify(record.data.ancestors) === JSON.stringify(value)) ) {
                return record.data.ancestors;
            } else {
                return value;
            }
        }},           
        {name: 'expandable', type: 'bool', defaultValue: false, persist: false, convert: function(value, record) {
            if(record.data.childIds && record.data.childIds.length > 0) {
                return true;
            } else {
                return false;
            }        
        }},
        /**
         * @property {string} _id unique identifier for this task.
         * this value is generated client side using a convert 
         * function.
         */           
        {name: '_id', type: 'string', 
            convert: function(value, record) {
                // make sure we don't create a uuid for existing containers
                // loaded from couchdb
                if(value !== '') {
                    return value;
                }                 
                // make sure we don't create a uuid for the auto generated
                // default root container node or existing containers loaded from server
                // rootcontainer value is used in the ajax proxy url when loading initial data
                if(record.data.id === 'roottask') {
                    return record.data.id;
                }
                // UUID generator found on stackoverflow 
                // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
                
                return uuid;
            }
        }
    ],
    
    /**
     * Calls parent contstructor and also sets up events 
     * that will become available when this instance is
     * decorated by Ext.data.NodeInterface. Setting up the
     * events ahead of time allows us to setup
     * listeners before the instance is actually decorated.
     */ 
    constructor: function() {
        this.addEvents('beforeappend', 'beforeinsert', 'beforeremove', 'append', 'insert', 'remove');
        return this.callParent(arguments);
    },
    
    /**
     * Adds the {@link HL.model.Task#_id} of a task
     * node to a specific index position in the 
     * {@link HL.model.Task#childIds} field of this task 
     * if it's not already there and updates the childIds field.
     * @param {Task} childNode task node to add
     * @param {Number} childIndex index position of the task 
     * node within childNodes 
     */       
    addChildId: function(childNode, childIndex) {
        childIndex = childIndex || this.indexOf(childNode);
        var existingChildIndex = this.data.childIds.indexOf(childNode.getId());
        if(existingChildIndex !== childIndex) {
            var kids = this.data.childIds.slice(0);
            kids.splice(childIndex, 0, childNode.getId())
            this.set('childIds', kids);   // set tracks modifications
        }    
    },
    
    /**
     * @private
     * Overrides {@link Ext.data.Model#afterEdit}
     * to fire an event for each field that has
     * been modified. The event name is the name of the
     * field with world modified appened to it: fieldnamemodified.
     * The event params are (model, newValue, oldValue).
     */
    afterEdit: function() {
        var me = this;
        Ext.Object.each(me.modified, function(key, oldValue, self) {
            // make sure we only fire this once
            // when we have an old value
            if(oldValue) {
                me.fireEvent(key+'modified', me, me.get(key), oldValue);
            }
        });
        this.callParent(arguments);
    },    
    
    /**
     * Synchronizes the persistent fields of this model with
     * fields of the same name in the passed in model.
     *
     * Keeps persistent fields of a single 
     * entity in sync even though it's being represented by more 
     * than once instance in the application.
     *
     * Example: When a container is selected in the {@link HL.view.ContainerTree}
     * we use it's raw data to make a new {@link HL.model.Task} instance
     * which becomes the root node of a {@link HL.view.TaskTree}.
     * Whenever a change is made to either instance we run this method to
     * make the persistente fields always stay in sync so we never run into
     * conflicts when we save/load data from the server.
     *
     * @param {Model} relayNode the data model to sync with
     */
    relayFields: function(relayNode) {
        var me = this;
        var relayFields = me.fields.filter('persist', true);
        
        relayFields.each(function(field, fieldIndex, fieldCount) {
            if(field.name in relayNode[relayNode.persistenceProperty]) {
                var silent = typeof field.silentRelay !== 'undefined' ? field.silentRelay : true;
                if(silent) {
                    relayNode[relayNode.persistenceProperty][field.name] = me[me.persistenceProperty][field.name];
                } else {
                    relayNode.set(field.name, me[me.persistenceProperty][field.name]);
                    var changes = relayNode.getChanges();
                    // if this field is the only thing that's changed then
                    // it's safe to silently commit the change
                    if(Ext.Object.getKeys(changes).length === 1) {
                        relayNode.commit(true);
                    }
                }
            }
        });
    },    
    
    /**
     * Removes the {@link HL.model.Task#_id} of a task node from this
     * task's {@link HL.model.Task#childIds} and updates the childIds field.
     * @param {Task} removedNode task node to remove
     */   
    removeChildId: function(removedNode) {
        var childIndex = this.data.childIds.indexOf(removedNode.getId());
        if(childIndex !== -1) {
            var kids = this.data.childIds.slice(0);
            kids.splice(childIndex, 1);
            this.set('childIds', kids);
        }
    },
    
    /**
     * Removes all of this container's {@link HL.model.Task#ancestors}
     * and sets the field to an empty array.
     */   
    removeAncestors: function() {
        this.get('ancestors').length = 0;
        // this will make the field modified
        this.set('ancestors', []);
    },

    /**
     * Trawls through this task's parentNodes
     * and captures the id of each node along the way
     * to add to this models {@link HL.model.Task#ancestors}. 
     * Then updates the ancestors field.
     */
    updateAncestors: function() {
        var ancestors = [this.getId()];
        var parent = this;
        while (parent.parentNode) {
            parent = parent.parentNode;
            ancestors.push(parent.getId());
        }
        
        this.set('ancestors', ancestors); 
    },
            
    listeners: {
        append: function(node, appendedNode, childIndex) {
            node.addChildId(appendedNode, childIndex);
            appendedNode.updateAncestors();
        },
        insert: function(node, childNode, refNode) {
            node.addChildId(childNode);
            childNode.updateAncestors();
        },
        remove: function(node, removedNode) {
            node.removeChildId(removedNode);
        }                
    }     
    
    
});