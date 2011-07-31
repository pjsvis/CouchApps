/**
 * @class HL.view.container.NewContainerWindow
 * @extends Ext.form.Panel
 * 
 * Displays add/edit Container window.
 */
Ext.define('HL.view.container.NewContainerWindow', {
    extend: 'Ext.form.Panel',
    alias: 'widget.newcontainerwindow',
    
    requires: ['Ext.form.field.Hidden'],
    
    id: 'newcontainerwindow',
    title: 'New Task Container',
    layout: 'anchor',
    
    constructor: function(config) {
        this.initConfig(config);
        
        return this.callParent(arguments);
    },
    
    config: {
        width: 300,
        bodyPadding: 10,
        contstrain: true,
        frame: true,
        floating: true,
        defaults: {
            anchor: '100%'
        },
        items: [{
            xtype: 'textfield',
            name: 'name',            
            fieldLabel: 'Name',
            allowBlank: false
        },{
            xtype: 'combo',
            name: 'type',
            fieldLabel: 'Type',
            editable: false,
            forceSelection: true,
            displayField: 'label',
            valueField: 'name',
            store: [ ['list','List'],['folder', 'Folder'] ],
            allowBlank: true,
            listeners: {
                render: function() { this.setValue('list'); } // sets the default combo value to folder
            }
        },{
            xtype: 'hidden',
            name: '_id'
        }],
        buttons: [{
            xtype: 'button',
            text: 'Cancel',
            handler: function() {
                this.up('panel').destroy();
            }
        },{
            xtype: 'button',
            text: 'Save',
            /**
             * Make sure the form is valid before updating
             * and syncing with the data store.
             */
            handler: function() {
                var form = this.up('form').getForm();
                if(form.isValid()) {
                    var containerStore = Ext.data.StoreManager.lookup('containersStore');

                    if(form.findField('_id').getValue() !== '') {
                        form.updateRecord(form.getRecord());
                    } else {
                        var newContainer = Ext.ModelManager.create(form.getFieldValues(), 'HL.model.Container');
                        // get new container's parent from the store
                        var parentContainer = containerStore.getNodeById(newContainer.get('parentId'));
                        parentContainer.insertChild(0, newContainer);                                                                   
                        
                        newContainer.phantom = true;
                        newContainer.endEdit();
                        parentContainer.endEdit();
                    }
                    var nrecs = containerStore.getNewRecords();
                    var urecs = containerStore.getUpdatedRecords();
                    containerStore.sync();
                    this.up('panel').destroy();
                }
            }
        }],
        listeners: {
            'show': function() {
                this.query('textfield[name="name"]')[0].focus();             
            }
        }
    }

});