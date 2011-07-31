Ext.BLANK_IMAGE_URL = 'app/libs/ext-4.0.2/resources/themes/images/gray/tree/s.gif';

Ext.Loader.setConfig({enabled: true, disableCaching: false});
Ext.Loader.setPath({'Ext':'app/libs/ext-4.0.2/src','HL':'app', 'HL.libs':'app/libs/HL'});

Ext.require(['Ext.data.*',
             'Ext.tree.*', 
             'Ext.layout.container.Border',
             'Ext.layout.container.Card',
             'Ext.window.*',
             'Ext.form.field.ComboBox']
);

Ext.require(['HL.view.Viewport','HL.model.Container','HL.model.Task']);

Ext.application({
    name: 'HL',
    db: /\/(\w+)\//.exec(window.location)[1] || 'hublist',
    version: '0.7.1',
    autoCreateViewport: false,
    appFolder: 'app',
    
    models: ['Container','Task'],
    controllers: ['Containers','Tasks'],
    views: ['Viewport'],
    events: ['folderselect','listselect'],
    
    launch: function() {
        var pause = '';
        HL.app = this;
        Ext.create('HL.view.Viewport');
        this.updateCheck();
    },
    
    populateWelcomeData: function() {
        var containersStore = Ext.data.StoreManager.lookup('containersStore');
        
        var rootContainer = containersStore.getRootNode();
        rootContainer.set('name', 'Root Container (removing = serious breakage)');
        rootContainer.set('type', 'folder');        

        var gStartFolder = Ext.ModelManager.create({
            name: 'Getting Started',
            type: 'folder',
            leaf: false,
            expandable: true,
            expanded: true,
        }, 'HL.model.Container');
        
        var welcomeList = Ext.ModelManager.create({
            name: 'Welcome',
            type: 'list',
            parentId: gStartFolder.getId(),
            ancestors: ['rootcontainer', gStartFolder.getId()]
        }, 'HL.model.Container');
        
        var wTask1 = Ext.ModelManager.create({
            name: 'click on a list to view tasks',
            parentId: welcomeList.getId(),
            ancestors: [welcomeList.getId()]
        }, 'HL.model.Task');
        
        var wTask2 = Ext.ModelManager.create({
            name: 'double click on a list, folder, or task to edit it',
            parentId: welcomeList.getId(),
            ancestors: [welcomeList.getId()]
        }, 'HL.model.Task');        

        var wTask3 = Ext.ModelManager.create({
            name: 'folders can hold lists and sub-folders',
            parentId: welcomeList.getId(),
            ancestors: [welcomeList.getId()]
        }, 'HL.model.Task');

        var wTask4 = Ext.ModelManager.create({
            name: 'tasks can be nested inside each other (very soon)',
            parentId: welcomeList.getId(),
            ancestors: [welcomeList.getId()]
        }, 'HL.model.Task');
        
        wTask1.save();
        wTask2.save();
        wTask3.save();
        wTask4.save();
                
        gStartFolder.set('childIds', [welcomeList.getId()]);
        gStartFolder.save();
        
        welcomeList.set('childIds', [wTask1.getId(), wTask2.getId(), wTask3.getId(), wTask4.getId()]);
        welcomeList.save();

        rootContainer.set('childIds', [gStartFolder.getId()]);
        rootContainer.save({callback:function(record, operation) {
            containersStore.load({callback:function(records, operation, success) {
                containersStore.getRootNode().expand(true);
            }});    
        }});
    
    },
    
    /**
     * @private
     * checks to see if your using the latest version
     * of Hub List. Also passes along helpful platform info.
     */
    updateCheck: function() {
        var me = this;
        var payload = {};
        payload.updateCheck = true;
        
        if(Ext.isMac) {
            payload.osname = 'Mac OSX';
        } else if(Ext.isWindows) {
            payload.osname = 'Windows';
        } else if(Ext.isLinux) {
            payload.osname = 'Linux';
        } else {
            payload.osname = '';
        }
        
        payload.appversion = this.version;
        
        Ext.data.JsonP.request({
            url: 'http://cloud.hublistapp.com/',
            params: payload,
            callback: function(success, response) {
                if(success && response) {
                    if(response.latestVersion !== me.version) {
                        Ext.Msg.alert('Update Available ' + response.latestVersion, response.msg + ' Your using version ' + me.version + '.');
                    }
                }
            }
        });
    
    }
    
});