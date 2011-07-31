function(head, req, a, b) {
    var row;
    start({
        "headers": {
            "Content-Type": "text/html"
        }
    });
    send("<p>Contacts</p>");
    send("<p>Head</p>");
    send("<code>" + JSON.stringify(head) + "<code>");
    send("<p>Request</p>");
    send("<code>" + JSON.stringify(req) + "<code>");
    send("<p>A: " + a + "</p>");
    send("<p>B: " + b + "</p>");
    send("<p>Row</p>")
    while(row = getRow()) {
            send(JSON.stringify(row));
    }
}