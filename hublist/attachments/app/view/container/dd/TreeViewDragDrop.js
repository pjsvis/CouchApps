/**
 * Extends {@link Ext.tree.plugin.TreeViewDragDrop} so
 * we can use {@link HL.view.container.dd.ViewDragZone}
 * and {@link HL.view.container.dd.ViewDropZone} to have
 * greater control over {@link HL.view.container.Tree}
 * drag and drop operations.
 */
Ext.define('HL.view.container.dd.TreeViewDragDrop', {
    extend: 'Ext.tree.plugin.TreeViewDragDrop',
    alias: 'plugin.ctreeviewdragdrop',

    uses: ['HL.view.container.dd.ViewDragZone','HL.view.container.dd.ViewDropZone'],
    
    onViewRender : function(view) {
        var me = this;

        if (me.enableDrag) {
            me.dragZone = Ext.create('HL.view.container.dd.ViewDragZone', {
                view: view,
                ddGroup: me.dragGroup || me.ddGroup,
                dragText: me.dragText,
                repairHighlightColor: me.nodeHighlightColor,
                repairHighlight: me.nodeHighlightOnRepair
            });
        }

        if (me.enableDrop) {
            me.dropZone = Ext.create('HL.view.container.dd.ViewDropZone', {
                view: view,
                ddGroup: me.dropGroup || me.ddGroup,
                allowContainerDrops: me.allowContainerDrops,
                appendOnly: me.appendOnly,
                allowParentInserts: me.allowParentInserts,
                expandDelay: me.expandDelay,
                dropHighlightColor: me.nodeHighlightColor,
                dropHighlight: me.nodeHighlightOnDrop
            });
        }
    }
    
});    