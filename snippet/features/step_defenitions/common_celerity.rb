require 'active_support/inflector'
require 'celerity'
require 'tempfile'

When /I press "(.*)"/ do |button|
    @browser.button(:name, button).click
    assert_successful_response
end

When /I follow "(.*)"/ do |link|
    @browser.link(:text, /#{link}/).click
    assert_successful_response
end

When /I fill in "(.*)" for "(.*)"/ do |value, field|
    @browser.text_field(:id, find_label(field).for).set(value)
end

When /I fill in "(.*)" for the field named "(.*)"/ do |value, field|
    @browser.text_field(:name, field).set(value)
end

When /I check "(.*)"/ do |field|
    @browser.check_box(:id, find_label(field).for).set(true)
end

When /^I uncheck "(.*)"$/ do |field|
    @browser.check_box(:id, find_label(field).for).set(false)
end

When /I select "(.*)" from "(.*)"/ do |value, field|
    @browser.select_list(:id, find_label(field).for).select value
end

When /I choose "(.*)"/ do |field|
    @browser.radio(:id, find_label(field).for).set(true)
end

When /I wait for the AJAX call to finish/ do
    @browser.wait
end

Then /I should see "(.*)"/ do |text|
    div = @browser.div(:text, text)
end

Then /I should not see "(.*)"/ do |text|
    div = @browser.div(:text, /#{text}/).html rescue nil
    div.should be_nil
end

def find_label(text)
    @browser.label :text, text
end

def assert_successful_response
    status = @browser.page.web_response.status_code
    if(status == 302 || status == 301)
        location = @browser.page.web_response.get_response_header_value('Location')
        puts "Being redirected to #{location}"
        @browser.goto location
        assert_successful_response
    elsif status != 200
        show_html
        raise "Brower returned Response Code #{@browser.page.web_response.status_code}"
    end
end

def show_html
    tmp = Tempfile.new 'culerity_results'
    tmp << @browser.html
    tmp.close
    `firefox #{tmp.path}`
end
