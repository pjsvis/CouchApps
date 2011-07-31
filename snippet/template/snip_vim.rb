require 'rubygems'
require 'json'
require 'fileutils'

next_id = Dir.entries('.').map{|d| d.to_i}.sort.last+1
FileUtils.mkdir("#{next_id}")

dest = ".#{next_id}/#{next_id}.json"
json = JSON.parse(File.read(dest))
template = {"Comment"=>"", "Title"=>"", "Tags"=>"", "Language"=>""}
template.each { |k,v| json[k] = ''}

json["Created"]=Time.now.strftime("%Y-%m-%d %H:%M:%S")
File.open(dest,'w'){|f| f.write json.to_json}

puts 'Press enter to Edit snippet meta data'
gets
%x(vi "#{dest}"< `tty` > `tty`)
puts 'Press enter to edit snippet'
gets
%x(vi "#{next_id}/#{next_id}.txt"< `tty` > `tty`)
