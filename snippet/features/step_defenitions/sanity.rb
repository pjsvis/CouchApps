require 'active_support/inflector'
require 'celerity'
require 'tempfile'
require 'couchrest'

Before do
    @db ||= CouchRest.new("http://localhost:5984").database('snippets')
    @browser ||= Celerity::Browser.new
    @host = 'http://localhost:5984/snippets/_design/snippets/tagcloud.html'
end

After do
    @browser.close
end

When /I go home/  do
    @browser.goto @host 
    @browser.wait
end

Then /there should be "(.*)" entries of "(.*)"/ do |total, clazz|
     @browser.lis.select{|li| li.attribute_value('class')==clazz.singularize}.length.should equal(total.to_i)
end

When /I select "(.*)" tag/ do |text|
     tag = @browser.link(:xpath,"//a[@tag='#{text}']")
     tag.click
     @browser.wait
end

Then /all visible snippets should be of type "(.*)"/ do |type|
       divs = @browser.div(:id ,'snippetList').divs
       tags = divs.select { |div| div.attribute_value('class') == 'tags'}
       tags.should have_at_least(5).items
       tags.each {|tags| tags.text.should include('java')}
     # $browser.divs.select{|li| li.attribute_value('class')==clazz.singularize}.length.should equal(total.to_i)
end

Then /most common tag snippets should be listed/ do
    mostCommon = @db.view('snippets/top_n')["rows"].first()["value"].max {|f,s| f[1] <=> s[1]}
    divs = @browser.div(:id ,'snippetList').divs
    tags = divs.select { |div| div.attribute_value('class') == 'tags'}
    tags.each {|tags| tags.text.should include(mostCommon[0])}
end

When /I click on snippet "(.*)" view code link/ do |id|
     viewCodeLink = @browser.link(:xpath,"//a[@type='groovy' and @snippetid='#{id}']")
     viewCodeLink.click
     @browser.wait
end

Then /the snippet code should be displayed/ do

end
