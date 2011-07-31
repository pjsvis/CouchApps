function(head, req) {
	// !code lib/mustache.js
	start({ "headers": { "Content-Type": "application/rss+xml" } });

	var rssHeader="<?xml version='1.0' encoding='UTF-8' ?> \
	               <rss version='2.0' xmlns:content='http://purl.org/rss/1.0/modules/content/' xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:wfw='http://wellformedweb.org/CommentAPI/'> \
	                <channel> \
	                  <title>Lastest snippets</title> \
	                  <link>../tagcloud.html</link> \
	                  <description>Latest snippets feed.</description>";

	var closingHeader = "</channel>";

	var rssItem = "<item> \
	                   <title>{{Title}}</title> \
			   <link></link> \
                           <pubDate>{{Created}}</pubDate> \
			   <description>{{Comment}}</description> \
                   	</item>";

	send(rssHeader);
	while(row = getRow()) {
		send(Mustache.to_html(rssItem, row.value));
	}
	send(closingHeader);
}
