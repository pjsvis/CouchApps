function(doc) {
	// !code lib/date.js
	emit(Date.parse(doc.Created).getTime(), doc);  
}
