tagClick =  (event) ->
    event.preventDefault()
    tag = (this.getAttribute('tag')  || this.children[0].getAttribute('tag') )
    fetchTag(tag)

fetchTag = (tag) ->
    $.get("_list/snippets/tags?key=\"#{tag}\"" , (data) ->
        $('#snippetList').html(data)
        $('.tags a').click(tagClick)
        $('.codeSection a').click(codeClick))

codeClick = (event) ->
  event.preventDefault()
  div = $(this).closest('div')
  id = this.getAttribute('snippetId')
  type = this.getAttribute('type')
  $.get("../../../snippets/#{id}/#{id}.txt", (data) ->
      pre = "<pre id='snippetCode' name='code' class='brush:#{type} '>"
      _.each(['gutter' ,'smart-tabs'],(it) -> SyntaxHighlighter.defaults[it] = false)
      SyntaxHighlighter.all()
      $(div).html("#{pre}#{data} </pre>")
      SyntaxHighlighter.highlight())

initializeTopN = (data) ->
	$("<ul>").attr('id', 'tagList').appendTo('#tagCloud')
	sorted = _.sortBy(data.rows[0].value,(it) -> parseFloat(it))
	backround = 68
	rgbFactor = 255.0 / parseFloat(sorted.length)
	fontFactor = 0.7
	$.each(data.rows[0].value, (key, value) ->
        li = $("<li>").attr({class:'tag'})
        a = $("<a>").text(key+'('+value+')').attr({title:"See snippets tagged with #{key}", href:"",tag:key,count:value}).appendTo(li)
        index = _.sortedIndex(sorted,parseFloat(value))+1
        rgb =_.map([value,value,value],
            (v) -> parseInt(if (index*rgbFactor == backround) then (backround+25) else (index * rgbFactor)))

        $(a).hover(
            () -> $(this).css('color',"rgb(0,0,0)").animate({},'slow') ,
            () -> $(this).css('color','rgb('+rgb.join(',')+')').animate({},'slow'))

        li.children().css("color", 'rgb('+rgb.join(',')+')')
        li.children().css('backround-color', 'rgb(0,0,0)')
        li.children().css("fontSize", "#{Math.max(index * fontFactor,10)}pt")
        li.appendTo("#tagList")
	)


