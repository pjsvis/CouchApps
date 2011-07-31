/*global $ document */

$(function() {
	var $db, loggedIn = true, username;					// Variables.
	var checkLogin, loginDisplay, refreshThreads, app;	// Functions.
	
	$db = $.couch.db('modern-forum');
	
	checkLogin = function (callback) {
		$.couch.session({ success: function (data) {
			username = data.userCtx.name;
			if (username !== null) {
				callback(true);
			}
			else {
				callback(false);
			}
		}});
	};
	
	loginDisplay = function (logged) {
		if (logged) {
			// to do: append link to admin panel
			$('#credentials').html('<a href="#/settings">' + username + ' <img src="dropdown.png" width="16" height="16" alt="Settings"></a>');
			loggedIn = true;
		}
		else {
			username = 'Anonymous';
			loggedIn = false;
		}
	};
	
	refreshThreads = function () {
		$('#threads ul').empty();
		checkLogin(loginDisplay);
		if (loggedIn) {				// Why does this never work right?
			$('#threads ul').append('<li id="newThread"><a href="#/new/thread"><div class="spacer">New Thread</div></a></li>');
		}
		$db.view('modern-forum/threads', {
			success: function(data) {
				var i, id, title, html;
				for (i = 0; i < data.rows.length; i++) {
					id = data.rows[i].id;
					title = data.rows[i].value;
					html = '<li id="' + id + '"><a href="#/thread/' + id + '"><div class="spacer">' + title + '</div></a></li>';
					$('#threads ul').append(html);
				}
			}
		});
	};
	
	app = $.sammy('#content', function () {
		var currentThread = '';
		refreshThreads();	// later, get and pass in the forum for the threads
		
		this.get('#/', function (context) {
			$("#content").empty();
			checkLogin(loginDisplay);
		});
		
		this.get('#/login', function (context) {
			var html = '<div class="reply"><h1>Login</h1><form action="#/post/login" method="put"><input type="text" name="username" id="loginUsername" autofocus required placeholder="Username?"><input type="password" name="password" required placeholder="Password?"><input type="submit" value="Login"></form></div>';
			$('#content').empty();
			$('#content').append(html);
		});
		
		this.get('#/register', function (context) {
			var html = '<div class="reply"><h1>Register</h1><form action="#/post/register" method="put"><input type="text" name="username" id="registerUsername" required placeholder="Desired username?"><input type="password" name="password" required placeholder="Password?"><br><br><input type="email" name="email" required placeholder="Email?"><input type="url" name="avatar" placeholder="Avatar URL?"><input type="submit" value="Register"></form></div>';
			$('#content').empty();
			$('#content').append(html);
		});
		
		this.get('#/settings', function (context) {
			$('#content').empty();
		});
		
		this.get('#/user/:name', function (context) {
			$('#content').empty();
			//$("#content").append(this.params['name']);
		});
		
		this.get('#/new/thread', function (context) {
			var reply = '<div class="reply"><h1>New Thread</h1><form action="#/post/thread" method="put"><input type="text" name="threadTitle" id="threadTitle" autofocus required placeholder="Type your thread\'s title here"><br><textarea id="replyBox" name="postContent" required placeholder="Type your post here"></textarea><br><input type="submit" value="Create Thread"></form></div>';
			
			$('#content').empty();
			$('#content').append(reply);
		});
		
		this.get('#/thread/:id', function (context) {
			var that = this;
			currentThread = this.params.id;
			$('#content').empty();
			
			// Display all the posts in the thread. Kinda hacky, as it returns ALL the 
			// posts in the database and we have to filter here.
			$db.view('modern-forum/posts', {
				success: function(data) {
					var i, id, thread_id, title, html, reply;
					reply = '<div class="reply"><form action="#/post/reply" method="put"><textarea id="replyBox" name="postContent" required placeholder="Type your reply here"></textarea><br><input type="submit" value="Reply"></form></div>';
					
					for (i = 0; i < data.rows.length; i = i + 1) {
						id = data.rows[i].key;
						thread_id = data.rows[i].value.thread_id;
						user_id = data.rows[i].value.user_id;
						content = data.rows[i].value.content;
						//$('#' + thread_id + " li").addClass('selectedThread');
						if (that.params.id == thread_id) {
							html = '<div class="post"><a href="#/user/' + user_id + '" class="user"><img src="http://i.imgur.com/arExL.png" width="120" height="120" alt="" />' + user_id + '</a><div>' + content + '</div><div class="signature"></div>';
							$('#content').append(html);
						}
					}
					checkLogin(loginDisplay);
					if (loggedIn) {
						$('#content').append(reply);	// later, make sure thread is not locked.
					}
				}
			});
		});
		
		this.put('#/post/login', function (context) {
			$.couch.login({ name: this.params.username, password: this.params.password });
			checkLogin(loginDisplay);
			window.location = '#/';
		});
		
		this.put('#/post/register', function (context) {
			var doc, password = this.params.password;
			
			doc = {
				name: this.params.username,
				email: this.params.email,
				avatar: this.params.avatar
			};
			
			$.couch.signup(doc, password);
			//$.couch.login({ name: this.params['username'], password: this.params['password'] });	// For some reason, produces an error.
			checkLogin(loginDisplay);
			window.location = '#/login';		// to do: go to new user/welcome screen
		});
		
		this.put('#/post/reply', function (context) {
			var postContent = this.params.postContent, doc = {
				type: 'post',
				content: postContent,
				thread_id: currentThread,
				user_id: username,
				datetime: null
			};
			
			$db.saveDoc(doc, {
				success: function () {
					var html;
					
					$('#replyBox').val('');
					html = '<div class="post"><a href="#/user/' + username + '" class="user"><img src="http://i.imgur.com/arExL.png" width="120" height="120" alt="" />' + username + '</a><div>' + postContent + '</div><div class="signature"></div>';
					$('.post').last().after(html).fadeIn();
					$('input').blur();
					// Later, check if new posts were added in the meantime and add them first.
				},
				error: function () {
					alert("Cannot save the post.");
				}
			});
		});
		
		this.put('#/post/thread', function (context) {
			var threadTitle = this.params.threadTitle, postContent = this.params.postContent, threadDoc, postDoc;
			
			threadDoc = {
				type: 'thread',
				title: threadTitle,
				forum_id: null
			};
			
			// Save the thread doc, then make a post doc for it.
			$db.saveDoc(threadDoc, {
				success: function (threadData) {
					postDoc = {
						type: 'post',
						content: postContent,
						thread_id: threadData.id,
						user_id: username,
						datetime: null
					};
					
					$db.saveDoc(postDoc, {
						success: function (postData) {
							var threadURL = '#/thread/' + threadData.id;
							window.location = threadURL;
							refreshThreads();
						},
						error: function () {
							alert('Cannot save the post.');
						}
					});
				},
				error: function () {
					alert('Cannot save the thread.');
				}
			});
		});
	});
	
	$.couch.userDb(function () {
		console.log(arguments);	
	});
	
	checkLogin(loginDisplay);
	app.run('#/');
});