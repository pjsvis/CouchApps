/**
 * @class HL.view.task.Tree
 * @extends Ext.tree.Panel
 * 
 * Task tree panel.
 */
Ext.define('HL.view.task.Tree', {
    requires: ['HL.store.Tasks', 'HL.view.task.NewTaskWindow'],
    
    extend: 'Ext.tree.Panel',
    alias: 'widget.tasktree',
    
    id: 'taskTreePanel',
    title: 'Tasks',
    
    config: {
        rootVisible: false,
        bodyPadding: '6 0 0 0',
        displayField: 'name',
        lines: false,
        useArrows: true,
        store: 'tasksStore',
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            items: [{
                xtype: 'button',
                id: 'newTaskBtn',
                text: '+'
            }]
        }]
    },
    
    viewConfig: {
        plugins: {
            ptype: 'treeviewdragdrop',
            ddGroup: 'tasks',
            allowParentInsert: true
        }
    },
     
    /**
     * Initializes config overrides
     * and calls parent constructor.
     * @param {Object} config configuration object
     */      
    constructor: function(config) {
        this.initConfig(config);      
        return this.callParent(arguments);
    },
    
    /**
     * @private
     * Creates the data store for the Tree using
     * the selected Container as the root if it's been set
     * as the (rootList) when this Tree was created.
     */
    initComponent: function() {       
        var me = this;
        me.title = me.store.getRootNode().get('name');
        me.store.getRootNode().on('namemodified', function(model, newValue, oldValue) {
            me.setTitle(newValue);
        });
        me.callParent(arguments);
    } 
    
    

});