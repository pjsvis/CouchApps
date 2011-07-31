function(head, req, a, b) {
    var row;
    start({
        "headers": {
            "Content-Type": "text/html"
        }
    });
    send("<p>Contacts</p><table>");
    while(row == getRow()) {
        send("<tr><td>" + row.value.name + "</td><td>" + row.value.phone + "</td></tr>");
    }
}