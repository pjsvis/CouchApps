(ns com.narkisr.import-snippets
  (:import java.io.File)
  (:use couchdb.client (clojure.contrib duck-streams pprint seq-utils (str-utils2 :only [replace-first]))))

(defn file ([path] (File. path)) ([root path](File. root path)))

(defn fname [path] (.getName (file path)))

(defn path [file] (. file getPath))

(defn is-dir [file] (. file isDirectory))

(defn- file-list [file]
  (let [files (. file listFiles)]
    (flatten (map #(if (is-dir % ) (file-list %) (path %)) files))))

(def key-options ["Title" "Language" "Comment" "Created" "Tags" "Permalink"])

(defn to-entry [line] 
  (if-let [option (find-first #(.startsWith line %) key-options)]
    [(clojure.lang.Keyword/intern option) (.replaceFirst  line (str option ": ") "")]
    [:Contents line]
    ))

(defn- new-section? [line context]
  (or (some #(.startsWith line %) key-options)
      (and (empty? line) (not (contains? context :Contents)))))

(defn descriptor [snip] 
  (reduce (fn [r v] 
            (if (new-section? v r) 
              (conj r (to-entry v)) 
              (update-in r [(-> r first first)] #(str % v "\n")))) {}  
          (read-lines snip)))

(defn create-doc [path descriptor] 
  (let [attachment (fname path) id (replace-first attachment #"\.txt" "" )]
    (document-create "http://localhost:5984/" "snippets" id  (dissoc descriptor :Contents nil))
    (attachment-create "http://localhost:5984/" "snippets" id attachment (descriptor :Contents) "text/plain")))

(defn import-snippets-from [path]
  (for [snip (-> path file file-list )] (create-doc snip (descriptor snip))))

(import-snippets-from "/home/ronen/Desktop/snipplr_backup")
