/**
 * @class HL.controller.Tasks
 * @extends Ext.app.Controller
 */
Ext.define('HL.controller.Tasks', {
    extend: 'Ext.app.Controller',
              
    refs: [
        {
            ref: 'taskTree',
            selector: 'tasktree'
        }, {
            ref: 'mainPanel',
            selector: 'viewport > #mainCenterPanel'
        }, {
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
            'tasktree': {
                itemdblclick: this.taskDblClick
            },
            'tasktree toolbar #newTaskBtn': {
                click: function() {
                    // this approach gets rid of arguments
                    // passed in from clicking the button
                    this.showNewTaskWindow();
                }
            }            
        });        
        
        app.addListener({'listselect': this.onListSelect, scope: this});
    },
    
    /**
     * Changes the list of tasks currently being displayed
     * when a container is selected. If an {@link HL.view.task.Tree}
     * already exists then it updates it. If it doesn't exist
     * then it creates a new one.  
     * 
     * The root node of
     * {@link HL.store.Tasks} is created using raw data from the currently 
     * selected {@link HL.model.Container} during this process.
     * @param {Ext.tree.View} treeView from {@link HL.view.container.Tree}
     * @param {Container} list newly selected list
     * @param {Array} selections all selected items in the {@link HL.view.container.Tree}
     * @param {Object} options additional options from selectionchange event
     */
    onListSelect: function(treeView, list, selections, options) {                
        var mainPanel = this.getMainPanel();
        var taskTree = this.getTaskTree();
                
        if(taskTree) {
            var tasksStore = taskTree.getStore();
            tasksStore.setRootNode(list.raw);
        } else {
            var taskTree = Ext.create('HL.view.task.Tree', {store: Ext.create('HL.store.Tasks', {root:list.raw})});
            mainPanel.add(taskTree);
        }
    },
    
    /**
     * @private
     * Normalizes the {@link HL.view.task.Tree} itemdblclick
     * event before calling {@link HL.controller.Tasks#showNewTaskWindow}
     * with the node that was double clicked.
     */    
    taskDblClick: function(tree, node, itemEl, itemIndex, eventObj) {
        this.showNewTaskWindow(node);
    },    
    
    /**
     * Creates and displays a new 
     * {@link HL.view.task.NewTaskWindow}
     * @param {Task} task task instance 
     * to load into the form.
     */    
    showNewTaskWindow: function(task) {
        var ntw = Ext.create('HL.view.task.NewTaskWindow');
        if(task && task.isNode) {
            ntw.setTitle('Edit Task');
            ntw.loadRecord(task);
        }
        ntw.show();    
    },
    
    /**
     * Updates the title of the {@link HL.view.task.Tree}
     * with the name of the current root node {@link HL.store.Tasks}.     
     */
    updateTaskTreeTitle: function() {
        var taskTree = this.getTaskTree();
        if(taskTree) {
            taskTree.setTitle(Ext.StoreManager.lookup('tasksStore').getRootNode().get('name'));
        }
    } 


});      
        