function(doc) {
	empty = function(val){return val? true:false}
	doc.Tags.split(" ").filter(empty).forEach(function(tag) { emit(tag, 1); });
}
