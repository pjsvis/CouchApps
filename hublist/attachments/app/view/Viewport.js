/**
 * @class HL.view.Viewport
 * @extends Ext.container.Viewport
 * 
 * Main application Viewport.
 */
Ext.define('HL.view.Viewport', {
    requires: ['HL.view.container.Tree','HL.view.task.Tree'],
    
    extend: 'Ext.container.Viewport',
    
    layout: 'border',
    padding: '6 8',

    config: {
        items: [{
            xtype: 'container',
            id: 'mainCenterPanel',
            region: 'center',
            layout: 'card' 
    	}, {
    		xtype: 'container',
    		id: 'mainLeftPanel',
    		region: 'west',
    		minWidth: 175,
    		width: 225,	
            split: true,    			
    		layout: 'fit',
    		items: [{
    		  xtype: 'containertree'
    		}]
        }],                        
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
    
	initComponent: function() {

	   this.callParent(arguments);
    }
    
		
});