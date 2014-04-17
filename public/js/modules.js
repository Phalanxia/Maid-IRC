var UpdateInterface = (function () {
	"use strict";

	var module = function () {};

	// Update channel/PM user list
	module.prototype.directory = function () {
		var channelList = Object.keys(client.info.channels);
		select('#sidebar > ul').innerHTML = '';

		function updateChannelMenu (element, index) {
			select('#sidebar > ul').insertAdjacentHTML('beforeend', '<li data-type="channel" data-alert="" data-channelNumber="' + index + '"><i class="fa fa-comments-o"></i><span>' + element + '</span></li>');
		}

		channelList.forEach(updateChannelMenu);

		// Now lets update the navigation for the directory.
		function buildIt (i) {
			client.info.focusedChannel = channelList[i].toLowerCase();

			if (client.info.channels[channelList[i]].topic !== undefined) {
				select('#channelConsole header input').value = client.info.channels[channelList[i]].topic;
			} else {
				select('#channelConsole header input').value = '';
			}

			[].map.call(selectAll('#sidebar > ul li'), function(obj) {
				obj.classList.remove('focusedChannel');
			});

			select('#sidebar > ul li:nth-of-type(' + (i+=1) + ')').classList.add('focusedChannel');
			select('#users ul').innerHTML = '';

			// Show messages that are from the focused channel.
			[].map.call(selectAll('#channelConsole output article[data-channel="' + client.info.focusedChannel + '"]'), function(obj) {
				obj.style.display = '';
			});

			// Hide messages that are not from the focused channel.
			[].map.call(selectAll('#channelConsole output article:not([data-channel="' + client.info.focusedChannel + '"])'), function(obj) {
				obj.style.display = 'none';
			});
		};

		var items = select('#sidebar > ul').getElementsByTagName('li');

		var i;
		for (i = 0; i < items.length; i++) {
			items[i].i = i;
			items[i].onclick = buildIt(i);
		}
	};

	// Update console
	module.prototype.message = function (type, head, channel, message) {
		// Filter the message of html unfriendly characters
		message = message
			.replace(/&/g, "&amp;")
			.replace(/"/g, '&quot;')
			.replace(/'/g, "&apos;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

		// Create get the time for the timestamp
		var rawTime = new Date(),
			scrollInfoView; // And this varible for later
		// Lets format the timestamp
		var timestamp = "[" + ("0" + rawTime.getHours()).slice(-2) + ":" + ("0" + rawTime.getMinutes()).slice(-2) + ":" + ("0" + rawTime.getSeconds()).slice(-2) + "]";

		if (["message", "action", "notice"].indexOf(type) > -1) {
			// Lets highlight your nick!
			var highlightNick = function (name, input) {
				var exp = new RegExp('\\b(' + name + ')', 'ig');
				return input.replace(exp, '<span class="highlighted">$1</span>');
			};

			var i;
			for (i = 0; i < client.settings.highlights.length; i++) {
				message = highlightNick(client.settings.highlights[i], message);
			}
		}

		// If there is no specified channel just use the one the client is currently focused on
		if (typeof channel === 'undefined') {
			channel = client.info.focusedChannel;
		}

		// If scrolled at the bottom set scrollIntoView as true.
		if (select('#channelConsole output').scrollHeight - select('#channelConsole output').scrollTop === select('#channelConsole output').clientHeight) {
			scrollInfoView = true;
		}

		select('#channelConsole output').removeChild(select('#channelConsole output #filler'));
		select('#channelConsole output').insertAdjacentHTML('beforeend', '<article class="consoleMessage" data-messageType="' + type + '" data-channel="' + channel.toLowerCase() + '"><aside><time>' + timestamp + '</time><span> ' + head + '</span></aside><p>' + message + '</p></article><article id="filler"><div></div></article>');


		// Hide messages not from the focused channel
		[].map.call(selectAll('#channelConsole output article:not([data-channel="' + client.info.focusedChannel + '"])'), function(obj) {
			obj.style.display = 'none';
		});

		// Scroll to bottom unless the user is scrolled up
		if (scrollInfoView) {
			select('#channelConsole output').scrollTop = select('#channelConsole output').scrollHeight;
		}
	};

	// Update topic
	module.prototype.topic = function (topic) {
		select('#channelConsole header input').value = '';
		select('#channelConsole header input').value = topic;
	};

	// Update users
	module.prototype.users = function (channel) {
		// Clear interface.
		select('#users > ul').innerHTML = '';
		select('#users header p').innerHTML = '';

		// Set up userlist.
		var _channel = client.info.channels[channel],
			_userList = [],
			_opCount = 0,
			_users = _channel.users;

		for (var k in _users) {
			_userList.push(k);
		}

		// Lets sort the userlist based on rank and alphabatizing.
		_userList.sort(function(a, b) {
			var rankString = "\r+~@";
			var rankA = rankString.indexOf(_users[a]),
				rankB = rankString.indexOf(_users[b]);

			var rankSort = rankA == rankB ? 0 : (rankA > rankB ? -1 : 1);
			if (rankSort === 0) {
				return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
			}
			return rankSort;
		});

		for (var i = 0; i < _userList.length; i++) {
			var identifyer = '';
			if (_users[_userList[i]] == "@") {
				identifyer = '<span class="fa fa-circle rank0"></span>';
			} else if (_users[_userList[i]] == "+") {
				identifyer = '<span class="fa fa-circle rank1"></span>';
			} else if (_users[_userList[i]] == "~") {
				identifyer = '<span class="fa fa-circle rank1"></span>';
			} else {
				identifyer = '<span></span>';
			}

			select('#users ul').insertAdjacentHTML('beforeend', '<li>' + identifyer + '<p>' + _userList[i] + '</p></li>');

			// Get the op count.
			if (_users[_userList[i]] === "@" || _users[_userList[i]] === "~") {
				_opCount = _opCount+=1;
			}
		}

		// Get user count
		select('#users header p').innerHTML = _opCount + " ops, " + Object.keys(_channel.users).length + " total";
	};

	return module;
})();

var Messaging = (function () {
	"use strict";

	var module = function (socket, updateInterface) {
		this.socket = socket;
		this.updateInterface = updateInterface;
	};

	// Update channel/PM user list
	module.prototype.send = function (data) {
		if (data === '') {
			return;
		} else if (data.substring(0, 1) != "/") {
			// It's not a command.
			this.socket.emit('sendMessage', [client.info.focusedChannel, data]);
			// Display it in the client.
			this.updateInterface.message(
				"message",
				client.info.nick,
				client.info.focusedChannel,
				data
			);
		} else {
			// It's a command.
			data = data.substring(1, data.length);

			var _command = data.split(" ")[0],
				_message = data.substring(_command.length + 1, data.length),
				_commandList = ['me', 'join', 'part', 'whois', 'notice', 'away', 'topic'],
				_commandFound = false,
				_focusedChannel = client.info.focusedChannel;

			// Check to see if the command is in commandList.
			for (var i = 0; i < _commandList.length && !_commandFound; i++) {
				if (_commandList[i] == _command) {
					_commandFound = true;
				}
			}

			// It's not a command.
			if (!_commandFound) {
				this.updateInterface.message("log", "**", _focusedChannel, 'Sorry, "' + _command + '" is not a recognized command.');
				return;
			}

			// It is a command so lets run it!
			switch (_command) {
				case "me":
					this.socket.emit('sendCommand', {
						type: "action",
						channel: _focusedChannel,
						message: _message
					});
					this.updateInterface.message("action", "&raquo;", _focusedChannel, client.info.nick + " " + _message);
					break;
				case "join":
					var _channels = _message.split(" ");
					for (var i = 0; i < _channels.length; i+=1) {
						this.socket.emit('sendCommand', {
							type: "join",
							content: _channels[i]
						});
					}
					break;
				case "part":
					var _channels = _message.split(" ");
					for (var i = 0; i < _channels.length; i+=1) {
						this.socket.emit('sendCommand', {
							type: "part",
							content: _channels[i]
						});
					}
					break;
				case "notice":
					this.socket.emit('sendCommand', {
						type: "notice",
						channel: _focusedChannel,
						message: _message
					});
					this.updateInterface.message("notice", "-" + client.info.nick + "-", _focusedChannel, client.info.nick + " " + _message);
					break;
				case "away":
					this.socket.emit('sendCommand', {
						type: "away",
						message: _message
					});
					break;
				case "help":
					this.socket.emit('sendCommand', {
						type: "help",
						message: _message
					});
					break;
				case "topic":
					if (_message.split(" ")[0].charAt(0) === "#") {
						this.socket.emit('sendCommand', {
							type: "topic",
							channel: _message.split(" ")[0],
							message: _message.substring(_message.split(" ")[0].length+1)
						});
					} else {
						this.socket.emit('sendCommand', {
							type: "topic",
							channel: _focusedChannel,
							message: _message
						});
					}
					break;
			}
		}

		select('#channelConsole footer input').value = "";
	};

	module.prototype.recieve = function (data) {
		var i;

		switch (data.type) {
			case "message":
				this.updateInterface.message("message",	data.nick, data.channel, data.message );
				break;
			case "serverMessage":
				this.updateInterface.message("serverMessage", "*", "server", data.message);
				break;
			case "join":
				this.updateInterface.message("join", "*", data.channel, data.nick + " (" + data.info.host + ") has joined " + data.channel);
				break;
			case "part":
				this.updateInterface.message("part", "*", data.channel, data.nick + " (" + data.info.host + ") has left " + data.channel);
				break;
			case "quit":
				for (i = data.channels.length - 1; i >= 0; i--) {
					this.updateInterface.message("quit", "*", data.channels, data.nick + " (" + data.info.host + ") has quit " + data.channels[i] + " (" + data.reason + ")");
				}
				break;
			case "notice":
				this.updateInterface.message("notice", "-" + data.nick + "-", data.channel,	data.message);
				break;
			case "nickChange":
				for (i = data.channels.length - 1; i >= 0; i--) {
					this.updateInterface.message("nickChange", "&gt;", data.channels[i], data.oldNick + " is now known as " + data.newNick
					);
				}

				// Check to see if it's you that changed nick and update it on the client.
				if (data.oldNick === client.info.nick) {
					client.info.nick = data.newNick;
					select('#sidebar footer p').innerHTML = client.info.nick;
				}
				break;
			case "topic":
				var topicDate = new Date(data.args[3]*1000);
				this.updateInterface.message("topic", "&gt;", data.channel, 'Topic for ' + data.channel + ' set by ' + data.args[2] + ' at ' + topicDate);
				break;
			case "topicChange":
				this.updateInterface.message("topicChange",	"&gt;", data.channel, data.nick + ' has changed the topic to: "' + data.topic + '"');
				break;
		}
	}

	return module;
})();
