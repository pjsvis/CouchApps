/**
 * @class HL.view.container.Tree
 * @extends Ext.tree.Panel
 * 
 * Container tree panel.
 */
Ext.define('HL.view.container.Tree', {
    requires: ['HL.store.Containers', 'HL.view.container.NewContainerWindow', 'HL.view.container.dd.TreeViewDragDrop'],

    extend: 'Ext.tree.Panel',
    alias: 'widget.containertree',
    
    id: 'containerTreePanel',
    title: 'Folders',
    
    config: {
        rootVisible: false,
        bodyPadding: '6 0 0 0',        
        displayField: 'name',
        lines: false,
        useArrows: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'bottom',
            items: [{
                xtype: 'button',
                id: 'newContainerBtn',
                text: '+'
            }]
        }],
        listeners: {
            load: function(store, record, records, success, options) {
                // this is a temporary solution to select the first
                // list in the tree, eventually we'll select whatever
                // was previously selected by maintaining proper component states
                if(success && records.length > 0) { 
                    var topNode = store.getRootNode().childNodes[0];
                    if(topNode.get('type') === 'list') {
                        this.getView().select(topNode);                    
                    } else {
                        // assume the first child is a list
                        // todo: properly loop through children 
                        // recursively until we find a list
                        topNode.expand();
                        this.getView().select(topNode.childNodes[0]);
                    }
                }
            }
        }
    },
    
    viewConfig: {
        plugins: {
            ptype: 'ctreeviewdragdrop',
            ddGroup: 'local-containers',
            allowParentInsert: true
        }
    },
    
    /**
     * Initializes config overrides
     * and calls parent constructor.
     *
     * Includes a work-around to relay the
     * update event from Ext.data.NodeStore to
     * HL.store.Containers.
     * @param {Object} config configuration object
     */    
    constructor: function(config) {
        this.store = Ext.create('HL.store.Containers');
        this.initConfig(config);      
        var result = this.callParent(arguments);
        var nodeStore = this.getView().getStore();
        this.getStore().relayEvents(nodeStore, ['update']);
        return result;
    },
        
    /**
     * Selects the first node in the Tree.
     * @param {Ext.data.NodeInterface} startNode
     */
    selectFirstList: function(startNode) {
        var me = this;
        startNode = startNode || me.getStore().getRootNode();
        
        if(startNode.hasChildNodes()) {
            startNode.eachChild(function(node) {
                if(node.hasChildNodes) {
                    me.selectFirstList(node);                 
                }
            }, me);
        }        
    }
    

});