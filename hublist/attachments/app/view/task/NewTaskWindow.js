/**
 * @class HL.view.container.NewTaskWindow
 * @extends Ext.form.Panel
 * 
 * Displays add/edit Container window.
 */
Ext.define('HL.view.task.NewTaskWindow', {
    extend: 'Ext.form.Panel',
    alias: 'widget.newtaskwindow',
    
    requires: ['Ext.form.field.Hidden'],
    
    id: 'newtaskwindow',
    title: 'New Task',
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
            labelWidth: 55,
            allowBlank: false
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
                    var tasksStore = Ext.data.StoreManager.lookup('tasksStore');

                    if(form.findField('_id').getValue() !== '') {
                        form.updateRecord(form.getRecord());
                    } else {
                        var newTask = Ext.ModelManager.create(form.getFieldValues(), 'HL.model.Task');
                        // get new task parent from the store
                        var parent = tasksStore.getNodeById(newTask.get('parentId'));
                        parent.insertChild(0, newTask);                                                                   
                        
                        newTask.phantom = true;
                        newTask.endEdit();
                        parent.endEdit();
                    }
                    var nrecs = tasksStore.getNewRecords();
                    var urecs = tasksStore.getUpdatedRecords();
                    tasksStore.sync();
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