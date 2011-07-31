function(head, req) {
  // !code lib/mustache.js

  start({ "headers": { "Content-Type": "text/html" } });
  var empty = function(val){return val? true:false}

  var partials = { 
   tags: "{{#splitedTags}}<a class='tagLink' href='' tag={{.}}>{{.}} </a>{{/splitedTags}}",
   code: "<div class='codeSection'> \
	    <a snippetId={{_id}} type = {{BrushType}} href=''>Show code</a> \
	  </div>"
  };

  var template = "<div id='snippet' class='roundedcornr_box_618268'> \
		  <div class='roundedcornr_top_618268'><div></div></div> \
		   <div class='roundedcornr_content_618268'> \
	             <h3 class='snippetTitle'>{{Title}}:</h3> \
	             <div class='comment'>{{Comment}}</div> \
		     <div class='tags'>Tags: {{>tags}}</div> {{>code}} \
		   </div> \
                   <div class='roundedcornr_bottom_618268'><div></div></div> \
		   </div> \
		   <div class='sep'/> \
		   ";

  while(row = getRow()) {
     row.value['splitedTags']=function(){return this.Tags.split(" ").filter(empty);}
     row.value['BrushType']=function(){return this.Language.toLowerCase();}
     var html = Mustache.to_html(template, row.value,partials);
     send(html);
  }
}
