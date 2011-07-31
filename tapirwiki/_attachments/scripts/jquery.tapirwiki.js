(function($) {

   var   _currentPath,
         _lastPath,
         _pathInterval;

  function hashChanged() {
    _currentPath = getPath();
    // if path is actually changed from what we thought it was, then react.
    if (_lastPath != _currentPath) {
      // return triggerOnPath(_currentPath);
      if (window.onbeforeunload==unloadMessage){
          alert("Please save or cancel your edits first!");
      }
      else {
           wiki.open(_currentPath);
      }
    }
  }
  
  $.tapirWiki = {
    pageChangeReset : function(page) {_lastPath=_currentPath=page;}
  };

  function pollPath(every) {
    function hashCheck() {        
      _currentPath = getPath();
      // path changed if _currentPath != _lastPath
      if (_lastPath != _currentPath) {
        setTimeout(function() {
          $(window).trigger('hashchange');
        }, 1);
      }
    };
    
    hashCheck();
    _pathInterval = setInterval(hashCheck, every);
    $(window).bind('unload', function() {
      clearInterval(_pathInterval);
    });
  }

  // bind the event
  $(function() {
    if ('onhashchange' in window) {
      // we have a native event
    } else {
      pollPath(100);
    }
    // setTimeout(hashChanged,50);
    $(window).bind('hashchange', hashChanged);
  });

 
  function goPath(newPath) {
    window.location = 'wiki.html#'+newPath;
    _lastPath = getPath();
  };
  
  function getPath() {
    // we are only interested in the hash before the ">"
    var matches = window.location.hash.match(/#([^>]+)/);
    return matches ? matches[1] : '';
  };


})(jQuery);
  
