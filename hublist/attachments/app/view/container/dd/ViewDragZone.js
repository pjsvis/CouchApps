Ext.define('HL.view.container.dd.ViewDragZone', {
    extend: 'Ext.tree.ViewDragZone',
    
    beforeDragDrop: function(target, e, id){
        return true;
    }, 

    beforeDragEnter: function(target, e, id) {
        return true;
    },
    
    /**
     * @private
     * Makes sure folders and lists cannot be dropped
     * onto lists.
     * @param {Ext.dd.DragDrop} target The drop target
     * @param {Event} e The event object
     * @param {String} id The id of the dragged element
     */
    beforeDragOver: function(target, e, id) {
        var overRecord = null;
        var node = e.getTarget(target.view.getItemSelector());
        
        if(node) {
            overRecord = target.view.getRecord(node);
        }
        
        // enforce not being able to drop things onto lists
        if(overRecord && overRecord.data.type === 'list') {
            return false;
        } else {
            return true;
        }
    }
    
       
});