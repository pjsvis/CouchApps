db = $.couch.db("contacts");

function updatecontacts() {
    $("#contacts").empty();

    db.view("contacts/byname", {
        success: function(data) {
            for (i in data.rows) {
                $("#contacts").append('<div id="' + data.rows[i].value._id + '" class="contactrow"><span>' +
                                      data.rows[i].value.name +
                                      "</span><span>" +
                                      data.rows[i].value.phone +
                                      "</span><span>" +
                                      '<a href="#" id="' + data.rows[i].value._id + '" class="edit">Edit Contact</a>' +
                                      "</span><span>" +
                                      '<a href="#" id="' + data.rows[i].value._id + '" class="remove">Remove Contact</a>' +
                                      "</span></div>"
                                     );
            }
        }
    });
}

function contactform(doctoedit) {  
    var formhtml;
    formhtml = 
        '<form name="update" id="update" action="">';

    if (doctoedit) { 
        formhtml = formhtml + 
            '<input name="docid" id="docid" type="hidden" value="' + doctoedit._id + '"/>';
    }

    formhtml = formhtml + 
        '<table>';

    formhtml = formhtml +
        '<tr><td>Name</td>' + 
        '<td><input name="name" type="text" id="name" value="' + 
        (doctoedit ? doctoedit.name : '') + 
        '"/></td></tr>';
    formhtml = formhtml + 
        '<tr><td>Phone</td>' + 
        '<td><input name="phone" type="text" id="phone" value="' + 
        (doctoedit ? doctoedit.phone : '') + 
        '"/></td></tr>';
    formhtml = formhtml + '<tr><td>Email</td>' + 
        '<td><input name="email" type="text" id="email" value="' + 
        (doctoedit ? doctoedit.email : '') + 
        '"/></td></tr>';
    
    formhtml = formhtml + 
        '</table>' + 
        '<input type="submit" name="submit" class="update" value="' +
        (doctoedit ? 'Update' : 'Add') + '"/>' + 
        '</form>';
    $("#contactform").empty();
    $("#contactform").append(formhtml);
}  

function builddocfromform(doc,form) { 
    if (!doc) {
        doc = new Object;
    }
    doc.name = form.find("input#name").val();
    doc.phone = form.find("input#phone").val();
    doc.email = form.find("input#email").val();
    
    return(doc);
}

$(document).ready(function() {

    updatecontacts();

    $("#contacts").click(function(event) {

    var target = $(event.target);
    if (target.is('a')) {
        id = target.attr("id");

        if (target.hasClass("edit")) {
            db.openDoc(id, { success: function(doc) { 
                contactform(doc);
            }});
        }
        
        if (target.hasClass("remove")) {
            html = '<span class="confirm">Really Delete? ' + 
                '<a href="#" id="' + id + '" class="actuallydel">Delete</a>' +
                '<a href="#" id="' + id + '" class="canceldel">Cancel</a></span>';
            target.parent().append(html);
        }
        
        if (target.hasClass("actuallydel")) {
            
            db.openDoc(id, { 
                success: function(doc) { 
                    db.removeDoc(doc, { success: function() {
                    target.parents("div.contactrow").remove();
                    }
                                       });
                }
            }
                       );
        }
        
        if (target.hasClass("canceldel")) {
            target.parents("span.confirm").remove();
        }
    }
    });

    $("a.add").live('click', function(event) {  
        contactform();
    });

    $("input.update").live('click', function(event) {  
        var form = $(event.target).parents("form#update");  

        var id = form.find("input#docid").val();
        if (id) {
            db.openDoc(id, {
                success: function(doc) { 
                    db.saveDoc(builddocfromform(doc,form), {
                        success: function() { 
                            $("form#update").remove();
                            updatecontacts();
                        }});
                },
            });
        }
        else
        {
            db.saveDoc(builddocfromform(null,form), {
                success: function() { 
                    $("form#update").remove();
                    updatecontacts();
                },
            });
        }
        return false;
    });
});
