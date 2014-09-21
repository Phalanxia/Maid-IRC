var UpdateInterface = (function () {
	"use strict";

	var module = function () {};

	// Update channel/PM user list
	module.prototype.directory = function () {
		var channelList = Object.keys(client.networks.channels);

		select('#sidebar > ul').innerHTML = '';

		function updateChannelMenu (element, index) {
			select('#sidebar > ul').insertAdjacentHTML('beforeend', '<li data-type="channel" data-alert="" data-channelNumber="' + index + '"><i class="fa fa-comments-o"></i><span>' + element + '</span></li>');
		}

		channelList.forEach(updateChannelMenu);

		// Now lets update the navigation for the directory.
		function buildIt (i) {
			client.networks.focusedChannel = channelList[i].toLowerCase();


			if (typeof client.networks.channels[channelList[i]].topic !== "undefined") {
				select('#channelConsole header input').value = client.networks.channels[channelList[i]].topic;
			} else {
				select('#channelConsole header input').value = '';
			}

			[].map.call(selectAll('#sidebar > ul li'), function (obj) {
				obj.classList.remove('focusedChannel');
			});

			select('#sidebar > ul li:nth-of-type(' + (i+=1) + ')').classList.add('focusedChannel');
			select('#users ul').innerHTML = '';

			// Show messages that are from the focused channel.
			[].map.call(selectAll('#channelConsole output article[data-channel="' + client.networks.focusedChannel + '"]'), function (obj) {
				obj.style.display = '';
			});

			// Hide messages that are not from the focused channel.
			[].map.call(selectAll('#channelConsole output article:not([data-channel="' + client.networks.focusedChannel + '"])'), function (obj) {
				obj.style.display = 'none';
			});
		}

		var items = select('#sidebar > ul').getElementsByTagName('li');

		var i;
		for (i = 0; i < items.length; i++) {
			items[i].i = i;
			items[i].onclick = buildIt(i);
		}
	};

	// Update console
	module.prototype.message = function (data) {
		// console.log("New Message:" + JSON.stringify(data));
		// Filter the message of html unfriendly characters
		var message = data.message
			.replace(/&/g, "&amp;")
			.replace(/"/g, '&quot;')
			.replace(/'/g, "&apos;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

		// Create get the time for the timestamp
		var rawTime = new Date(),
			scrollInfoView; // And this variable for later
		// Lets format the timestamp
		var timestamp = ("0" + rawTime.getHours()).slice(-2) + ":" + ("0" + rawTime.getMinutes()).slice(-2) + ":" + ("0" + rawTime.getSeconds()).slice(-2);

		// If it's not a message from the server
		if (data.channel !== "SERVER") {
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
		if (typeof data.channel === 'undefined') {
			data.channel = client.networks.focusedChannel;
		}

		// If scrolled at the bottom set scrollIntoView as true.
		if (select('#channelConsole output').scrollHeight - select('#channelConsole output').scrollTop === select('#channelConsole output').clientHeight) {
			scrollInfoView = true;
		}

		select('#channelConsole output').removeChild(select('#channelConsole output #filler'));
		select('#channelConsole output').insertAdjacentHTML('beforeend', '<article class="consoleMessage" data-messageType="' + data.type + '" data-channel="' + data.channel.toLowerCase() + '"><aside><time>' + timestamp + '</time><span> ' + data.head + '</span></aside><p>' + message + '</p></article><article id="filler"><div></div></article>');


		// Hide messages not from the focused channel
		[].map.call(selectAll('#channelConsole output article:not([data-channel="' + client.networks.focusedChannel + '"])'), function (obj) {
			obj.style.display = 'none';
		});

		// Scroll to bottom unless the user is scrolled up
		if (scrollInfoView) {
			select('#channelConsole output').scrollTop = select('#channelConsole output').scrollHeight;
		}
	};

	// Update topic
	module.prototype.topic = function (topic) {
		topic = topic || '';
		select('#channelConsole header input').value = '';
		select('#channelConsole header input').value = topic;
	};

	// Update users
	module.prototype.users = function (channel) {
		// Clear interface.
		select('#users > ul').innerHTML = '';
		select('#users header p').innerHTML = '';

		// Set up user list.
		var _channel = client.networks.channels[channel],
			_userList = [],
			_users = _channel.users;

			_userList = Object.keys(client.networks.channels[channel].users);

		// Lets sort the user list based on rank and alphabetizing.
		_userList.sort(function(a, b) {
			var rankString = "\r~&@%+";
			var rankA = rankString.indexOf(_users[a]),
				rankB = rankString.indexOf(_users[b]);

			var rankSort = rankA == rankB ? 0 : (rankA > rankB ? -1 : 1);
			if (rankSort === 0) {
				return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
			}
			return rankSort;
		});

		for (var i = _userList.length - 1; i >= 0; i--) {
			var identifyer = '';

			switch (_users[_userList[i]]) {
				case "+": // Voiced
					identifyer = '<span class="fa fa-comment"></span>';
					break;
				case "%": // Half-ops
					identifyer = '<span class="fa fa-shield"></span>';
					break;
				case "@": // Ops
					identifyer = '<span class="fa fa-lock"></span>';
					break;
				case "&": // Admins
					identifyer = '<span class="fa fa-globe"></span>';
					break;
				case "~": // Owners
					identifyer = '<span class="fa fa-heart"></span>';
					break;
				default:
					identifyer = '<span></span>';
					break;
			}

			select('#users ul').insertAdjacentHTML('beforeend', '<li>' + identifyer + '<p>' + _userList[i] + '</p></li>');
		}

		// Get user count
		select('#users header p').innerHTML = _userList.length + " users";
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
			this.socket.emit('send', ["PRIVMSG", client.networks.focusedChannel, data]);
			// Display it in the client.
			this.updateInterface.message({
				type: "PRIVMSG",
				head: client.networks.nick,
				nick: client.networks.nick,
				channel: client.networks.focusedChannel,
				message: data
			});
		} else {
			// It's a command.
			data = data.substring(1, data.length);

			var _command = data.split(" ")[0],
				_message = data.substring(_command.length + 1, data.length),
				_commandList = ['me', 'join', 'part', 'whois', 'notice', 'away', 'topic'],
				_commandFound = false,
				_focusedChannel = client.networks.focusedChannel;

			// Check to see if the command is in commandList.
			for (var i = 0; i < _commandList.length && !_commandFound; i++) {
				if (_commandList[i] == _command.toLowerCase()) {
					_commandFound = true;
				}
			}

			// It's not a special command that we need to do amazing things with. Display it and send it to the server.
			if (!_commandFound) {
				this.updateInterface.message({
					type: "PRIVMSG",
					head: "&gt;",
					nick: "COMMAND",
					channel: _focusedChannel,
					message: data
				});
				return;
			}

			// It is a command so lets run it!
			switch (_command) {
				case "me":
					this.socket.emit('send', ["ACTION", _focusedChannel, _message]);
					this.updateInterface.message({
						type: "ACTION",
						head: "&raquo;",
						nick: "COMMAND",
						channel: _focusedChannel,
						message: client.networks.nick + " " + _message
					});
					break;
				case "join":
					this.socket.emit('send', ["JOIN", "", _message]);
					break;
				case "part":
					var _channels = _message.split(" ");
					for (var i = 0; i < _channels.length; i+=1) {
						this.socket.emit('sendCommand', {
							type: "part",
							channels: _channels[i]
						});
					}
					break;
				case "notice":
					this.socket.emit('sendCommand', {
						type: "notice",
						channel: _focusedChannel,
						message: _message
					});
					this.updateInterface.message("notice", "-" + client.networks.nick + "-", _focusedChannel, client.networks.nick + " " + _message);
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
		if (data.commandType == "normal") {
			switch (data.command.toLowerCase()) {
				// Commands
				case "ping":
					break;
				case "privmsg":
					this.updateInterface.message({
						type: "privmsg",
						head: data.nick,
						nick: data.nick,
						channel: data.args[0],
						message: data.args[1]
					});
					break;
				case "notice":
					this.updateInterface.message({
						type: "notice",
						head: data.nick,
						nick: data.nick,
						channel: data.args[0],
						message: data.args[1]
					});
					break;
				case "mode":
					break;
				case "join":
					// Make sure the joined channel is in the current saved channel object
					if (client.networks.channels[data.args[0]] === undefined) {
						client.networks.channels[data.args[0]] = {};
					}

					// If it's us update the sidebar
					if (data.nick == client.networks.nick) {
						this.updateInterface.directory();
					}

					// If its the focused channel update the userlist
					if (client.networks.channels[data.args[0]].users !== undefined) {
						if (data.args[0] == client.networks.focusedChannel || client.networks.focusedChannel == "") {
							this.updateInterface.users(data.args[0]);
						}
					}

					// Add the join message to the console
					this.updateInterface.message({
						type: "join",
						head: data.nick,
						nick: data.nick,
						channel: data.args[0],
						message: data.nick + " (" + data.prefix + ") has joined " + data.args[0]
					});
					break;
				case "part":
					break;
				case "quit":
					break;
				case "nick":
					break;
				default:
					break;
			}
		} else if (data.commandType === "reply") {
			switch (data.rawCommand) {
				// Numerics
				case "001":
					client.networks.nick = data.args[0];
					this.updateInterface.message({
						type: "rpl_welcome",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: data.args[1]
					});
					break;
				case "002":
					this.updateInterface.message({
						type: "rpl_yourhost",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: data.args[1]
					});
					break;
				case "003":
					this.updateInterface.message({
						type: "rpl_created",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: data.args[1]
					});
					break;
				case "004":
					var messages,
						k;

					for (k in data.args) {
						messages = k + " "; // I think this should work?
					}

					this.updateInterface.message({
						type: "rp_myinfo",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: messages
					});
					break;
				case "005":
					var networkName = data.args[9].split("NETWORK=");

					if (networkName.length > 1) {
						if (typeof networkName !== undefined) {
							select('#sidebar h2').innerHTML = networkName[1];
							client.networks.name = networkName[1];
						} else {
							select('#sidebar h2').innerHTML = data.server;
							client.networks.name = data.server;
						}
					}
					break;
				case "251":
					this.updateInterface.message({
						type: "rpl_luserclient",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: data.args[1]
					});
					break;
				case "332":
					// If we dont have the channel stored, lets do that now!
					if (client.networks.channels[data.args[1]] === undefined) {
						client.networks.channels[data.args[1]] = {};
					}
					// Save the topic
					client.networks.channels[data.args[1]].topic = data.args[2];

					if (client.focusedChannel === data.args[1]) {
						select('#channelConsole header input').value = data.args[2];
					}
					break;
				case "333":
					var topicDate = new Date(data.args[3]*1000);
					this.updateInterface.message({
						type: "rpl_topicwhotime",
						head: "&gt;",
						nick: "SERVER",
						channel: data.args[1],
						message: 'Topic for ' + data.args[1] + ' set by ' + data.args[2] + ' at ' + topicDate
					});
					break;
				case "353":
					// Build the user list and set the joined channels
					var _channel = data.args[2],
						_names = data.args[3].split(" "),
						_re = new RegExp("^([+~&@%]*)(.+)$"),
						_values;

					if (client.networks.channels[_channel] === undefined) {
						client.networks.channels[_channel] = {};
					}

					client.networks.channels[_channel].users = {};

					for (var i = _names.length - 1; i >= 0; i--) {
						if (_names[i] !== "") {
							_values = _re.exec(_names[i]);
							client.networks.channels[_channel].users[_values[2]] = _values[1];
						}
					}

					this.updateInterface.users(_channel);
					break;
				case "366":
					break;
				case "372":
					this.updateInterface.message({
						type: "rpl_motd",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: data.args[1]
					});
					break;
				case "376":
					this.updateInterface.message({
						type: "rpl_endofmotd",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: data.args[1]
					});
					break;
				case "443":
					this.updateInterface.message({
						type: "err_nicknameinuse",
						head: "&gt;",
						nick: "SERVER",
						channel: "SERVER",
						message: data.args[1] + ": " + data.args[2]
					});
					break;
			}

		}
	};

	return module;
})();
