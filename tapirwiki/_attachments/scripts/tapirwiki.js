/* Tapir Wiki JS
  A wiki system which is hosted by CouchDB...
  Original work: Joshua Knight
*/

// JV: make the functions needed for rendering
textileparser=makeTextileParser();
tapirparseandreplace=maketapirwikiparseandreplace();
htmlrenderer=makehtmlrenderer();

function convert(text){ 
    return htmlrenderer(tapirparseandreplace(textileparser(text)));
}

String.prototype.toCamelCase = function() {
	  return this.toString()
	    .replace(/([A-Z]+)/g, function(m,l){
	      return l.substr(0,1).toUpperCase() + l.toLowerCase().substr(1,l.length);
	    })
	    .replace(/[\-_\s](.)/g, function(m, l){
	      return l.toUpperCase();
	    });
	};

//Set some settings...
var settings;

function addBreadcrum(pageName) {
	
	//see if the new page is the last page visited
	
	if($("#breadcrumbs :last").html() != pageName) {
	
		$("#breadcrumbs span").each(function(i){
			if($(this).html() == pageName){
				$(this).fadeOut(300, function() { $(this).remove(); });
			}
		});
		//now, if we need to add a page we create the new crumb and remove the oldest
		if(pageName !== '') {
			var bc = $("<span>" + pageName + "</span>");
			bc.click(function(){wiki.open(pageName);});
			bc.hide();
			
			var crumbs = $("#breadcrumbs"); 
			//remove the first breadcrumb if there are more than 4
			if(crumbs.children().size() > 20) {
				$("#breadcrumbs :first-child").fadeOut(300, function() { $(this).remove(); });
			}
			
			bc.appendTo(crumbs);
			bc.fadeIn(300);
		}
	}
}

wiki = {};

//wiki page properties
wiki._id = "";
wiki._rev = "";
wiki.body = "";
wiki.edited_by = "";
wiki.edited_on = "";
wiki.type = "page";
wiki.comment = "";


wiki.save = function() {

	if(wiki._rev === null)
	{
		wiki._id = $("#title").val();
	}
	
	if(wiki._id === "")
	{
		error("Please enter a page title!");
	}
	else {
	wiki.body = $("#body").val();
	wiki.edited_by = $.cookie("userName");
	wiki.edited_on = Date();
	wiki.comment = $("#comment").val();

	$.ajax({
		type:	'put',
		url:	'../../' + this._id,
		data:	JSON.stringify(this),
		async:	false,
		success:	function(data) {
			var response = JSON.parse(data);
			wiki._rev = response.rev;
			wiki.open(wiki._id);
			$.jGrowl("Your page has been saved...", {header: "Cool!"});
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); }
	});
	}
	
};

wiki.display = function(bm) {
	var n = $("<div id='page-body'>" + convert(this.body) + "</div>").hide();
	$("#inner-content").html(n);
	n.fadeIn("fast");
	$("#pageTitle").html(this._id);
	$("#page-menu").html("");
	$("<li class='pageSpecific'><a href='Javascript: wiki.edit()'>Edit</a></li>").appendTo("#page-menu");
	$("<li class='pageSpecific'><a href='Javascript: wiki.history()'>History</a></li>").appendTo("#page-menu");
        if (wiki._attachments){
	   $("<li class='pageSpecific'><a href='Javascript: wiki.attachments()' style='color:#005dff;'>Attachments</a></li>").appendTo("#page-menu");
        }
        else {
           $("<li class='pageSpecific'><a href='Javascript: wiki.attachments()'>Attachments</a></li>").appendTo("#page-menu");
        }
	$("<li class='pageSpecific'><a href='Javascript: wiki.remove()'>Delete</a></li>").appendTo("#page-menu");
	window.location = "wiki.html#" + this._id + (bm ? ">"+bm:"");
    $.tapirWiki.pageChangeReset(this._id+ (bm ? ">"+bm:""));
    
    
    
};

wiki.init = function(exclattdesc) {
	wiki._id = "";
	delete wiki._rev;
	delete wiki._revisions;
	delete wiki._attachments;
        if(!exclattdesc){delete wiki.attachdescr;}
	wiki.body = "";
	wiki.edited_on = "";
	wiki.edited_by = "";
        wiki.comment="";
};

wiki.populate = function(data, exclattdesc) {
        var page = JSON.parse(data);
        wiki._id = page._id;
	wiki._rev = page._rev;
	wiki.body = page.body;
	wiki._revisions = page._revisions;
	wiki.edited_on = page.edited_on;
	wiki.edited_by = page.edited_by;
        wiki.comment = page.comment;
        if (page.hasOwnProperty("_attachments")){
            wiki._attachments = page._attachments;
        }
        if (!exclattdesc && page.hasOwnProperty("attachdescr")){
            wiki.attachdescr=page.attachdescr;
        }
};


wiki.remove = function() {
		if (confirm("Really delete this page?")) {
		$.ajax({
		type:	'delete',
		url:	'../../' + wiki._id + '?rev=' + wiki._rev,
		success:	function(){
			$.jGrowl("Page has been deleted...", {header: "Cool!"});
			$("#page-body").fadeOut("slow", wiki.open('FrontPage'));
			},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); }
		});
	}
};

wiki.refresh = function(id, exclattdesc){ // call this if you want to repopulate the wiki in synchronous fashion
        wiki.init(exclattdesc);
        $.ajax({
		type:	'get',
		url:	'../../' + id + "?revs=true",
                async: false,
		success: function(data){wiki.populate(data, exclattdesc);},

		error: function (XMLHttpRequest, textStatus, errorThrown) {
				error("Ooooops!, REFRESH request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText);
			 }
	});
};



wiki.open = function(id, bm) {
	wiki.init();
	$.ajax({
		type:	'get',
		url:	'../../' + id + "?revs=true",
		success: function(data) {
			wiki.populate(data);
                        wiki.display(bm);
			addBreadcrum(wiki._id);
			},

		error: function (XMLHttpRequest, textStatus, errorThrown) {
			wiki._id = id;
			wiki.edit();
			 }
	});
};

// functions needed in wiki.edit but perhaps also elsewhere
function setConfirmUnload(on) {
   
     window.onbeforeunload = (on) ? unloadMessage : null;

}

function unloadMessage() {
   
     return 'You have entered new data on this TapirWiki page.';

}


wiki.edit = function() {
                $.tapirWiki.pageChangeReset(this._id);
		$("#inner-content").html("");
		$("<h2>" + this._id + "</h2>");

		var form = $("<form id='addNote'></form>").hide().appendTo("#inner-content").fadeIn("slow");

		if(wiki._rev)
		{
			//if there is a revision, it is an existing page and the title should be displayed read only
			$("<p id='title'>" + this._id + "</p>").appendTo(form);
		}

		else
		{
			//if no revision, it's a new page and we should let the user enter a page name

			$("<p><input id='title' type='text' value='" + this._id + "'/></p>").appendTo(form);
			$("#title").focus();

			$("#title").blur(function() {
				var newTitle = $("#title").val().toCamelCase();
				$("#title").val(newTitle); 
			});

			var pages;
			$.ajax({
			type:	'get',
			url:	'_view/titles',
			async:   false,
			success:	function(data) {
				var results = JSON.parse(data);
				pages = results;
				},

			error: function (XMLHttpRequest, textStatus, errorThrown) {
				pageContent = "INCLUDE ERROR!" + id + " does not exist yet...";
				 }
			});
			//create the templates region.
			var templatesDiv = $("<div id='templates'>Page templates:<a id='shower'>Show</a></div>").appendTo(form);
			var templatesList = $("<ul id='templatesList'></ul>").hide().appendTo(templatesDiv);
			$("#shower").click(function() {

				if($("#shower").html() == "Show")
				{
					$("#shower").html("Hide");
					$(templatesList).slideDown("slow");
				}
				else
				{
					$("#shower").html("Show");
					$(templatesList).slideUp("slow");
				}
				});

			var anyTemplates = false;

			for(var x = 0; x < pages.total_rows; x++)
					{
						var template = pages.rows[x];
						if(template.id.substring(12,0) == "PageTemplate")
							 {
								$("<li><a onClick='Javascript: wiki.applyTemplate(\"" + template.id + "\")'>" + template.id.replace("PageTemplate","") + "</a></li>").appendTo(templatesList);
								anyTemplates = true;
							 }
					}
			if(anyTemplates === false)
			{
				//$("<p>No templates found. Create a page with a name starting TEMPLATE_ to get it listed here (e.g TEMPLATE_MyTemplate)</p>").appendTo(templatesList);
				$(templatesDiv).hide();
			}

		}
		$("<p><textarea id='body'>" + this.body + "</textarea></p>").appendTo(form);

		$("<p><label>Comment:</label><input type='text' placeholder='Enter update comment here...' id='comment'/></p>").appendTo(form);
		
		$("#page-menu").html("");
		$("<li><a href='Javascript: setConfirmUnload(false); wiki.save();'>Save</a></li>").appendTo("#page-menu").fadeIn("slow");
		
		
		if(this._rev === undefined){
			$("<li><a href='Javascript: wiki.open(\"" + settings.defaultPage + "\");'>Cancel</a></li>").appendTo("#page-menu").fadeIn("slow");
		} else {
			$("<li><a href='Javascript: setConfirmUnload(false); wiki.display();'>Cancel</a></li>").appendTo("#page-menu").fadeIn("slow");
		}
		$("#pageTitle").html("New page");
                $(':input',form).bind("change", function() { setConfirmUnload(true); }); // Prevent accidental navigation away
};

wiki.applyTemplate = function(id) {
	$.ajax({
		type:	'get',
		url:	'../../' + id,
		success:	function(data) {
			var template = JSON.parse(data);
			$("#body").val(template.body);
			$("#shower").html("Show");
			$("#templatesList").slideUp("slow");
			},

		error: function (XMLHttpRequest, textStatus, errorThrown) {
			error("Error!");
			 }
	});
};


wiki.history = function() {
//This function creates a history list for the current page, showing previous revisions (which occur through editing the page) and conflicts (which occur through replication)

	//create a holder for the history list
	$('#page-body').html('<h2>Page history</h2><p>This page shows all stored historical versions of this page.</p><ul id="history"></ul>').hide().fadeIn("slow");
	//get the current rev number
	var rev = this._revisions.start;

	//create an array to hold the merged list of revisions and conflicts
	var oldPages = [];
	
	//iterate through the revisions for the current page
	for(var x in this._revisions.ids)
	{
		$.ajax({
			type:	'GET',
			url:	'../../' + this._id + '?rev=' + rev + '-' + this._revisions.ids[x],
			async:	false,
			success:	function(data) {
				var page = JSON.parse(data);
				oldPages.push(page);
			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); }
		});
		rev--;
	}

	//get conflicts for the current page, tag any pages as a conflict so we can identify them as such later
	$.ajax({ 
		type:	'GET',
		url:	'../../' + this._id + '?conflicts=true',
		async:	false,
		success: function(data) {
			var conflicts = JSON.parse(data);
			for(var rev in conflicts._conflicts) {
				$.ajax({
					type:	'GET',
					url:	'../../' + wiki._id + '?rev=' + conflicts._conflicts[rev],
					async:	false,
					success: function(data){
						page = JSON.parse(data);
						page.conflict = true;
						oldPages.push(page);
					},
					error: function (XMLHttpRequest, textStatus, errorThrown) {
						error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); 
					}				
				});
			}
	},
	error: function (XMLHttpRequest, textStatus, errorThrown) {
		error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); 
	}
	});

	//now we sort by date so that we have a nice chronological list to show the user
	oldPages.sort(function(a,b){	
		var dateA = Date.parse(a.edited_on);
		var dateB = Date.parse(b.edited_on);
		if (dateA < dateB) {
			return 1;
		} else {
			return -1;
		}
	});

	//remember previous versions in an array so we can view a historic version
	wiki.previousVersions = [];
	
	for(var page in oldPages)
	{	
		var event = "Edited ";
		if(oldPages[page].conflict) 
		{
			event = "Conflict ";
		}

		wiki.previousVersions[oldPages[page]._rev] = oldPages[page];
                var comment = ''
		if (!(oldPages[page].comment === undefined || oldPages[page].comment === '')){
                    comment = '<span class="comment">&quot;' + oldPages[page].comment + "&quot;</span>";
		}
		$('<li class="history-item"><a id="' + oldPages[page]._rev + '">' + event + ' on ' + oldPages[page].edited_on + ' by ' + oldPages[page].edited_by + '</a>' + comment +'</li>').appendTo('#history');
		$('#' + oldPages[page]._rev).click(function(){
			wiki.body = wiki.previousVersions[this.id].body;
			wiki.display();
	});
	}
};

wiki.sync = function() {
	localDBArr = location.toString().split("/",4);
	localDB = localDBArr[3];
	var repA = {"source": settings.replicationEndPoint,"target":localDB};
	var repB = {"source": localDB,"target":settings.replicationEndPoint};

	//replicate remote to local
	$.ajax({
		type: 'POST',
		url:	'/_replicate',
		data:	JSON.stringify(repA),
		success:	function(data) {
			$('#page-body').html("Synchronisation complete!");
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); 
		}
	});
	//and local to remote
	$.ajax({
		type: 'POST',
		url:	'/_replicate',
		data:	JSON.stringify(repB),
		success:	function(data) {
			$('#page-body').html("Synchronisation complete!");
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText);
		}
	});	
};

//wiki.load = function() {
	//I'm pretty sure this is horrible...need to wait for the location to be updated before opening the page
//	setTimeout(function() {
//		var requestedPage = location.hash.substring(1);
//		wiki.open(requestedPage);
//	}, 200);
//};

mimeicons = { 
              "audio/ogg" : "icons/mime/audio-ogg.svg",
              "application/pdf" : "icons/mime/mime-pdf.png",
              "application/x-pdf" : "icons/mime/mime-pdf.png",
              "application/rtf" : "icons/mime/application-rtf.png",
              "application/vnd.oasis.opendocument.text" : "icons/mime/ODF_textdocument.png",
              "application/vnd.oasis.opendocument.text-master" : "icons/mime/ODF_master.png",
              "application/vnd.oasis.opendocument.text-web" : "icons/mimi/ODF_html_template.png",
              "application/vnd.oasis.opendocument.graphics" : "icons/mime/ODF_drawing.png",
              "application/vnd.oasis.opendocument.presentation" : "icons/mime/ODF_presentation.png",
              "application/vnd.oasis.opendocument.spreadsheet" : "icons/mime/ODF_spreadsheet.png",
              "application/vnd.oasis.opendocument.formula" : "icons/mime/ODF_formula.png",
              "application/vnd.sun.xml.base" : "icons/mime/ODF_database.png",
              "application/msword" : "icons/mime/mime-msword.png",
              "application/msexcel" : "icons/mime/mime-msexcel.png",
              "application/vnd.ms-excel" : "icons/mime/mime-msexcel.png",
              "application/msaccess" : "icons/mime/mime-msaccess.png",
              "application/mspowerpoint" : "icons/mime/mime-mspowerpoint.png",
              "image/png" : "icons/mime/image-png.png",
              "image/bmp" : "icons/mime/image-bmp.png",
              "image/tiff" : "icons/mime/image-tiff.png",
              "image/gif" : "icons/mime/image-gif.png",
              "image/jpeg" : "icons/mime/image-jpeg.png",
              "image/x-ico" : "icons/mime/image-x-ico.png",
              "other" : "icons/mime/filetype-unknown.png"
             };

wiki.update = function() {
        delete this._revisions; //this gives some problems so it seems
	$.ajax({
		type:	'put',
		url:	'../../' + this._id,
		data:	JSON.stringify(this),
		async:	false,
		success:	function(data) {
			var response = JSON.parse(data);
			wiki._rev = response.rev;
			wiki.refresh(wiki._id);
			$.jGrowl("Document updated...", {header: "Cool!"});
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			error("Ooooops!, update request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); }
	});
	
	
};

wiki.attachments = function() {
		$('#page-body').html('<h2>Attachments</h2><form name="attachment_list"><table id="attachment-list"></table></form><div id="buttongroup"><button id="editdesc">Edit Descriptions</button><button id="delselec">Delete selected</button></div><div id="upload-form-holder"></div>').hide();
              
	
		$('<h3>New attachment</h3><table style="border:0px;"><tr valign="top"><td style="border:0px;"><form id="attachment-form" name="attachment_form" method="post" action="" content-type="multipart/form-data"><input id="_attachments" type="file" name="_attachments"/><input type="hidden" name="_rev" value="' + wiki._rev + '"/></form></td><td style="border:0px;">File description:</td><td style="border:0px;"><form id="att-descr-form" name="att_descr_form"><textarea name="attachdescr" style="height:50px; width:450px;" ></textarea></form></td><td style="border:0px;"><button id="upload-button">Upload File</button><br/><button id="replaceselec">Replace selected</button></td></tr></table>').appendTo('#page-body');

                chkboxchange = function (){ // determine visibility of "delete selected" and "replace selected" buttons
                        var numcheck = $("#attachment-list input[name='edit']:checked:enabled").length;
                        if (numcheck===0){ $("#delselec").hide(); $("#replaceselec").hide();}
                        else if (numcheck==1){$("#delselec").show(); $("#replaceselec").show();}
                        else {$("#delselec").show(); $("#replaceselec").hide();}
                };



                refreshattachlist= function(){
                    var icon = "";
                    $("#attachment-list").empty();
		    for(var f in wiki._attachments) {
                        if (mimeicons.hasOwnProperty(wiki._attachments[f].content_type)) {
                            icon=mimeicons[wiki._attachments[f].content_type];
                        }
                        else {
                            icon=mimeicons.other;
                        }
			$('<tr valign="top" id="'+f+'"><td><input type="checkbox" name="edit" value="'+f+'" onclick="chkboxchange()"></td><td><a href="../../' + wiki._id + '/' +  f + '"><img src="'+icon+'" border="0" /></a></td><td>'+ f + '</td><td><textarea class="filedesc" readonly="readonly" name="'+f+'" style="height:50px; width:600px">'+ ((wiki.attachdescr === undefined) ? "":  (wiki.attachdescr.hasOwnProperty(f) ? wiki.attachdescr[f] : "")) +'</textarea></td></tr>').appendTo("#attachment-list");
                    }
                    $("#replaceselec").hide();
                    $("#delselec").hide();
                };

                refreshattachlist();
                $('#page-body').fadeIn("slow");

                var comment="";
                var attachmentdescription;
                var attachment; 
                $('#attachment-form').ajaxForm(
 		     { 
		        target:    '',    
		        url:       "../../" + wiki._id, 
		        type:      'put',
		        async:     false,
			success:   function(data) {
                                        //data=data.match(/{.*}/)[0];
                                        //var response = JSON.parse(data);
                                        //wiki._rev = response.rev;
                                        wiki.refresh(wiki._id, true); // you have to refresh to get the new attachment data (otherwise an update conflict results)
                                                                // and also the rev (but this you could get with above commented out code as well) cannot use
                                                                //  wiki.open as this is asynch and repaints so new routine was needed.
                                                                // with the true we are excluding attachment descriptions from the update
                                        if (!wiki.attachdescr){
                                             wiki.attachdescr={};
                                        }
                                        wiki.attachdescr[attachment]=attachmentdescription;
                                        wiki.comment=comment;
                                        wiki.update(); // and refresh
                                        // invoke indexing of attachment but check first if attachment indexing is enabled
                                        if (settings.indexAttachmentsEnabled){
                                            indexAttachment(wiki._id, attachment, "update", wiki._attachments[attachment].content_type);
                                        };
                                        refreshattachlist();
                                        $('#attachment-form').resetForm();
                                        document.attachment_form._rev.value=wiki._rev;
                                        $('#att-descr-form').resetForm();

				   },
		         error:     function (XMLHttpRequest, textStatus, errorThrown) {
                                        error("Uploading failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText);
                                    }                 
                       }); 
		$("#upload-button").click(function() { 
                    attachment=document.attachment_form._attachments.value;
                    if (!attachment) return;
                    // attachment=attachment.replace(/[\-\s]/g, "_");
                    attachmentdescription=document.att_descr_form.attachdescr.value;
                    comment="added attachment "+attachment;
                    $('#attachment-form').submit();
	            // $("#attachment-form").ajaxSubmit(options); CANNOT use ajaxSubmit and ajaxForm on same form!! gives lots of problems
                });

		$("#replaceselec").click(function() { 
                    attachment=document.attachment_form._attachments.value;
                    var oldattachment=$("#attachment-list input[name='edit']:checked:enabled")[0].value
                    if (!attachment) return;
                    // if description is empty we assume user wants to keep old description
                    if (document.att_descr_form.attachdescr.value){
                        attachmentdescription=document.att_descr_form.attachdescr.value;
                    }
                    else {
                        attachmentdescription=wiki.attachdescr[oldattachment];
                    }
                    if (attachment!==oldattachment){
                       // attachment name is not the same same, we need to delete old attachment and attachment description first
                       //attachment=attachment.replace(/[\-\s]/g, "_");
                       deleteattachment(oldattachment);
                       document.attachment_form._rev.value=wiki._rev;
                    }
                    comment="replaced attachment "+attachment;
                    $('#attachment-form').submit();
                });

		$("#editdesc").click(function() { 
                    $('.filedesc').removeAttr('readonly');
                    $('#editdesc').hide();
                    $('#delselec').hide();
                    $('<button id="savedesc">Save Descriptions</button>').appendTo('#buttongroup');
                    $("#savedesc").click(function() {
                        var newattdescr={};
                        $elements=$('.filedesc');
                        for (var i=0; i<$elements.length; i++){
                           newattdescr[$elements[i].name]=$elements[i].value;
                        }
                        wiki.attachdescr=newattdescr;
                        wiki.update();
                        document.attachment_form._rev.value=wiki._rev;
                        refreshattachlist();
                        $('#editdesc').show();
                        $('#delselec').show();
                        $('#savedesc').hide();
                    });
                });
        
		$("#delselec").click(function() { 
                        var todelete=[];
                        var message = "Are you sure you want to delete the file";
                        if (document.attachment_list.edit.length){ // you have to do this check in case list has only one row
                            for (var i=0; i < document.attachment_list.edit.length; i++){
                                if (document.attachment_list.edit[i].checked){
                                    todelete.push(document.attachment_list.edit[i].value);
                                }
                            }
                        }
                        else if (document.attachment_list.edit.checked){
                             todelete.push(document.attachment_list.edit.value);
                        }
                        if (!todelete) return;
                        message += (todelete.length>1 ? "s "+ todelete : " " + todelete) + "?";
                        if (!confirm(message)) return;      
                        for (var i=0; i<todelete.length; i++){ deleteattachment(todelete[i]);}
                        wiki.update(); // do this to make sure attachment descriptions are in sync
                        document.attachment_form._rev.value=wiki._rev;
                        refreshattachlist();
                });

                deleteattachment = function(attname){
                            $.ajax({
		              type:	'delete',
		              url:	'../../' + wiki._id+'/'+attname+'?rev='+wiki._rev,
		              async:	false,
		              success:	function(data) {
			             var response = JSON.parse(data);
			             wiki._rev = response.rev;
                                     delete wiki._attachments[attname];
                                     delete wiki.attachdescr[attname];
                                     // update index but check first if attachment indexing is enabled
                                     if (settings.indexAttachmentsEnabled){
                                         indexAttachment(wiki._id, attname, "delete");
                                     };
			             $.jGrowl("File "+ attname +" deleted...", {header: "Cool!"});
                              },
		              error: function (XMLHttpRequest, textStatus, errorThrown) {
			          error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); 
                              }
	                    });

                }
};

//Finally, some miscellaneous useful functions

function indexAttachment(id, filename, action, mime){
    if (!mime){mime="";}
    $.ajax({
            target:    '',    
            url:       '../../_aix?id='+id + "&amp;fn=" + filename + "&amp;me=" + mime + "&amp;act=" + action, 
            type:      "get",
            async:     false,
            success:   function(data) {
                         var results = JSON.parse(data);
	               },
            error:     function (XMLHttpRequest, textStatus, errorThrown) {
                           pageContent = "Error!";
                       }          
           });
}             




function identify() {
	var name=prompt("Please enter your name", $.cookie("userName"));
	if (name!==null && name!="")
		{
			$.cookie("userName", name, { expires: 7 });
			$("#userName").html(name);
		}
}

function error(msg) {
	$.jGrowl(msg, {header: "Uh Oh!"});
}

var pageContent = "";

function couchftiSearch(qstring, summary, skip, perpage, maxresults, att){
        var pages;
        $.ajax({
                type:   'get',
                url:    '../../_fti?q='+qstring + "&amp;sl=" + (summary ? summary : "100") + "&amp;sk=" + (skip ? skip : "0") + "&amp;pp=" + (perpage ? perpage : "10") + "&amp;att=" + (att ? att : ""),
                async: false,
                success: function(data){
                             var results = JSON.parse(data);
                             pages=results;
                         },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
			pageContent = "Error!";
			 }
        });
        var html="";
//        if (pages[0].totmatches > 0){ // we have search results
        if (pages[0].totmatches){ // we have search results
            html = "<h3>Found "+pages[0].totmatches+" Results:</h3><ul class='page-list'>";

	    for(var x = 1; x < pages.length; x++){
                var p = pages[x];
                if (!att){
		    html += "<li><a href='#" + p._id + "' >" + p._id + "</a> rank: " + p.rank +"<br />Summary: "+p.summary+(p.hasOwnProperty('attachdescr')?"<br />Attachment descriptions: "+p.attachdescr:"")+"<br />Last edited on: "+p.edited_on+" by "+p.edited_by + "</li>";
                }
                else {
                    html += "<li><a href='../../" + p._id + "'>" + p._id + "</a> rank: " + p.rank +"<br />Summary: "+p.summary+"</li>";
                }
            }
	    html += "</ul>";
            // back and forward buttons
            if (skip > 0){
                html+="<a href=\"javascript: couchftiSearch('"+qstring+"',"+summary+","+ (skip-perpage)+","+ perpage+","+ maxresults+",'"+att+"')\">Page Back </a>";
            }
            if ((skip+perpage < pages[0].totmatches) && (skip+perpage < maxresults)){
                html+="<a href=\"javascript: couchftiSearch('"+qstring+"',"+summary+","+ (skip+perpage)+","+ perpage+","+ maxresults+",'"+att+"')\">Page Forward </a>";
            }
        }
        else { 
                html+="<h3>No Results Found!</h3>";
        }
        $("#search-results").html(html);
	return ;
}

//And finally...when the document is ready...

$(document).ready(function()
	{

		//To start, we need the settings for the wiki...
		$.ajax({
		    type:	'get',
		    url:	'../../TAPIRWIKISETTINGS',
		    async:   false,
		    success:	function(data) {
			    var result = JSON.parse(data);
			    settings = result;
			    //Set the wiki name
			    $('#wikiName').html(settings.wikiName);
                            // put also in title please
                            document.title=settings.wikiName;
                            //And get the menu items
			    for(var item in settings.mainMenu)
			    {
				    var m = settings.mainMenu[item];
				    $("<li><a href='#" + m + "' >" + m + "</a></li>").appendTo("#main-menu");
			    }

			    //and if replication is enabled show the sync menu item
			    if(settings.replicationEnabled && location.toString().match(settings.replicationEndPoint) === null) {
				    $("<li><a href='#' onClick='Javascript: wiki.sync()'>Synchronise</a></li>").appendTo("#main-menu");				
			    }

			    var requestedPage = location.hash.substring(1);
			    if (requestedPage == "")
			    {
				    //If it's blank, lets get it from settings
				    requestedPage  = settings.defaultPage;
			    }
                            // JV: set it as the base page for pathfinder
                            

			    //Now let's open the page
			    wiki.open(requestedPage);

			    //And now, set the user name. This is stored in a cookie, it's in no way an authentication system, just lets people tag their updates...
			    var userName = $.cookie("userName");
			    if (userName === null){
					//If there is no cookie set, get the default from the settings
					userName = settings.defaultUserName;
					$.cookie("userName", userName);
			    }
			    $('#userName').html(userName);
    
	            },

		    error: function(xhr, statusText) {
                               if(xhr.status == 404) {
					//  If we get a 404 from the settings, assume this is a first time install. Lets create some objects in the DB for us
					//and a place to show progress
					$("#container").html("<h1>Installing TapirWiki</h1><p>Before you use TapirWiki for the first time, a few default pages need to be loaded:</p><ul id='install-log'></ul><div id='install-result'></div>");
		                        $.ajax({
			                         type:	'GET',
			                         url:	'_show/systempages/_design%2Ftapir',
			                         async:	false,
			                         success:	function(data) {
				                                    var pages = JSON.parse(data);
                                                                    for(var p in pages) {
						                       pop(pages[p]);
                                                                }
                                                                $("#install-result").html("<h2>Installation complete</h2><p>Congratulations, TapirWiki has been set up correctly. Please refresh this page to access your new wiki or click <a href='./wiki.html'>here</a>.</p>");
				                                },
			                         error: function (XMLHttpRequest, textStatus, errorThrown) {
				                            error("Ooooops!, request failed with status: " + XMLHttpRequest.status + ' ' + XMLHttpRequest.responseText); }
                                         });		
                               }
		    }
		});
	});

function pop(obj) {
	$.ajax({
		type:	'put',
		url:	'../../'+obj._id,
		data:	JSON.stringify(obj),
		success: function(data) {
			$("#install-log").append("<li>" + obj._id + " loaded...</li>"); },
		error: function(data) {
			$("#install-log").append("<li style='color:#f00'>" + obj._id + " failed. Please delete this database and try again. If the problem persists, please log an issue <a href='http://code.google.com/p/tapirwiki/'>here</a>.</li>");
			}
	});
	
}

