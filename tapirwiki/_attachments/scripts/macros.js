function maketapirwikiparseandreplace(){
    // all the macros should either appear here or be imported here
    var pageContent = "";

    function includePage(str, id) {
	$.ajax({
		type:	'get',
		url:	'../../' + id,
		async:   false,
		success:	function(data) {
			var page = JSON.parse(data);
			pageContent = convert(page.body);
			},

		error: function (XMLHttpRequest, textStatus, errorThrown) {
			pageContent = "INCLUDE ERROR: <a href='Javascript: wiki.open(\"" + id + "\")'>" + id + "</a> does not exist yet...";
			 }
	});
	return pageContent;
    }

   function index() {
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
			pageContent = "Error!";
			 }
	});

	var html = "<ul class='page-list'>";

	for(var x = 0; x < pages.total_rows; x++)
			{
				var p = pages.rows[x];
				html += "<li><a href='#" + p.id + "' >" + p.id + "</a> edited on " + p.value.edited_on + " by " + p.value.edited_by + "</li>";
			}
	html += "</ul>";
	return html;
    }


    function recentChanges() {
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
				pageContent = "Error!";
				 }
		});

		pages.rows.sort(function(a,b){	
			var dateA = Date.parse(a.value.edited_on);
			var dateB = Date.parse(b.value.edited_on);
			if (dateA < dateB) {
				return 1;
			} else {
				return -1;
			}
		});


		var html = "<ul class='page-list'>";
		var recentPages = 5;
		if(pages.rows.lenght < recentPages)
		{
			recentPages = pages.rows.length;
		}
		for(var x = 0; x < recentPages; x++)
				{
					var p = pages.rows[x];
					html += "<li><a href='#" + p.id + "' >" + p.id + "</a> edited on " + p.value.edited_on + " by " + p.value.edited_by + "</li>";
					}
		html += "</ul>";
		return html;
    }



    function topicList(str, title) {
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
			pageContent = "INCLUDE ERROR: <a href='Javascript: wiki.open(\"" + id + "\")'>" + id + "</a> does not exist yet...";
			 }
	});

	var html = "<ul class='page-list'>";
	for(var x = 0; x < pages.total_rows; x++)
			{
				var p = pages.rows[x];
				if (p.id.substring(title.length, 0) == title) {

				html += "<li><a href='#" + p.id + "' >" + p.id + "</a> edited on " + p.value.edited_on + " by " + p.value.edited_by + "</li>";
			}
			}
	html += "</ul>";
	return html;
    }

    function maketoc(str,p1) {
        // var html='<script>$(\'<div id="toc"></div>\').prependTo(\'#content\'); $(\'<p id="toctit">Table of Contents:</p>\').appendTo(\'#toc\'); $.toc(\''+param+'\').appendTo(\'#toc\'); </script>';
        var html='<script>'
        html+='$(\'<div id="toc"></div>\').prependTo(\'#page-body\'); '
        html+='$.toc(\''+p1+'\').prependTo(\'#toc\'); '
        html+='$(\'<p id="toctit">Table of Contents:</p>\').prependTo(\'#toc\'); '
        html+='</script>'
        return html;
    }

    // regexes
    var tokens = {
        goToMacro         : {re : /\{goto:(\S.*?)\}/g,
                             sub: '<a href="#$1">$1</a>'},
        indexMacro        : {re : /\{index\}/, 
                             sub: index},
        topicMacro        : {re : /\{topic:(\S.*?)\}/g, 
                             sub: topicList},
        recentChangesMacro: {re : /\{recentChanges\}/, 
                             sub: recentChanges},
        includeMacro      : {re : /\{include:(.*?)\}/g,
                             sub: includePage },
        toc               : {re: /\{toc:(\S.*?)\}/g,
                             sub: maketoc}
    }; // end tapirwikitokens


    function parseandreplace(tnode){
        if (tnode.type =="#wikilink"){
             tnode.value='<a href="#'+tnode.value+'">'+tnode.value+'</a>';
        }
        else if (tnode.type == "#blocktoken"){              
            tnode.value=tnode.value.replace(tokens.indexMacro.re, tokens.indexMacro.sub);
            tnode.value=tnode.value.replace(tokens.topicMacro.re, tokens.topicMacro.sub);
            tnode.value=tnode.value.replace(tokens.recentChangesMacro.re, tokens.recentChangesMacro.sub);
            tnode.value=tnode.value.replace(tokens.toc.re, tokens.toc.sub);
            tnode.value=tnode.value.replace(tokens.includeMacro.re,tokens.includeMacro.sub);
            tnode.value=tnode.value.replace(tokens.toc.re, tokens.toc.sub)
            tnode.value=tnode.value.replace(tokens.goToMacro.re, tokens.goToMacro.sub); // can appear both as line and block token!
         }
        else if (tnode.type == "#linetoken"){
            tnode.value=tnode.value.replace(tokens.goToMacro.re, tokens.goToMacro.sub);
        }
        else {
             for (var i=0;i<tnode.siblings.length;i++) {parseandreplace(tnode.siblings[i]);}  // contents 
        }
    } // parseandreplace()
    return function (tree){
               parseandreplace(tree);
               return tree;
           };
} // end maketapirwikiparserandreplace()           
