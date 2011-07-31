require 'rubygems'
require 'json'
require 'fileutils'

puts "Please enter the mounted folder name"
folder = gets.chomp
entries = Dir.entries(folder)
next_id = entries.empty? ? 0 : (entries.map{|e| e.to_i}.sort.max + 1 )
FileUtils.mkdir("#{folder}/#{next_id}")
dest = "#{folder}/.#{next_id}/#{next_id}.json"
json = JSON.parse(File.read(dest))
template = {"Comment"=>"", "Title"=>"", "Tags"=>"", "Language"=>""}
template.each { |k,v| 
    puts "enter snippet #{k}"
    json[k] = gets.chomp
}
json["Created"]=Time.now.strftime("%Y-%m-%d %H:%M:%S")
File.open(dest,'w'){|f| f.write json.to_json}
