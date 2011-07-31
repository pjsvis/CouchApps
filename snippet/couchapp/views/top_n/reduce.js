// see http://wiki.apache.org/couchdb/View_Snippets#Retrieve_the_top_N_tags.
function(keys, values, rereduce) {
	// !code lib/underscore-min.js
	var MAX = 30, tags = {};

	if(!rereduce) {
		tags = _.reduce(_.zip(keys,values),{}, function(res,tup){ 
				res[tup[0][0]]=(res[tup[0][0]] || 0)+ tup[1]; 
				return res;
			});
	} else {
		_.each(values,function(hash){ 
				_.each(_.keys(hash),function(key){
						tags[key] = (tags[key] || 0) + hash[key];
					});
			});
	}

	var sortedKeys = _(tags).chain().keys().sortBy(function(key){return tags[key];}).value();
	_(MAX).times(function(){ sortedKeys.pop(); });
	_.each(sortedKeys,function(key){tags[key]=undefined;});
	return tags;
}
