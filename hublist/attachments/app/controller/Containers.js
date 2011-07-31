/**
 * @class HL.controller.Containers
 * @extends Ext.app.Controller
 */
Ext.define('HL.controller.Containers', {
    extend: 'Ext.app.Controller',
              
    refs: [
        {
            ref: 'containerTree',
            selector: 'containertree'
        }
    ],      
    
    /**
     * @private
     * Sets up refs and listeners for {@link HL.model.Container}
     * related UI events.
     */      
    init: function(app) { 
        this.control({
            'containertree': {
                itemdblclick: this.containerDblClick,
                selectionchange: this.containerSelectionChange
            },
            'containertree toolbar #newContainerBtn': {
                click: function() {
                    // this approach gets rid of arguments
                    // passed in from clicking the button
                    this.showNewContainerWindow();
                }
            },
            'newcontainerwindow': {
                savenewcontainer: this.saveNewContainer
            }    
        });
        
        app.addListener({'refreshcontainers': this.refreshContainers, scope: this});
    },
    
    /**
     * @private
     * Listens for {@link HL.view.container.Tree} selectionchange
     * fires an application event depending upon the type of
     * {@link HL.model.Container} that was selected.
     */    
    containerSelectionChange: function(treeView, selections, options) {
        var node = selections[0];
        var nodeType = node.get('type');
        if(nodeType === 'list' || nodeType === 'folder') {
            var eventName = nodeType + 'select';
            this.application.fireEvent(eventName, treeView, node, selections, options);        
        }
    },
    
    /**
     * @private
     * Normalizes the {@link HL.view.container.Tree} itemdblclick
     * event before calling {@link HL.controller.Containers#showNewContainerWindow}
     * with the node that was double clicked.
     */
    containerDblClick: function(tree, node, itemEl, itemIndex, eventObj) {
        this.showNewContainerWindow(node);
    },
    
    /**
     * Refreshes {@link HL.view.container.Tree}
     * by reloading it's store.
     */
    refreshContainers: function() {
        this.getContainerTree().getStore().load();
    },
    
    /**
     * Creates and displays a new 
     * {@link HL.view.container.NewContainerWindow}
     * @param {Container} container container instance 
     * to load into the form
     */    
    showNewContainerWindow: function(container) {
        var ncw = Ext.create('HL.view.container.NewContainerWindow');
        if(container && container.isNode) {
            ncw.setTitle('Edit Task Container');
            ncw.loadRecord(container);
        }
        ncw.show();
    }
})