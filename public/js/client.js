var client = {
	server: document.domain,
	status: {
		connection: false,
		pastDisconnect: false,
		away: false
	},
	focusedChannel: undefined,
	channels: [],
	nickname: "",
	highlights: [],
	channelList: "",
	settings: {
		awayMessage: "Away"
	}
};

var socket = io.connect('http://' + client.server + ':4848', {
	'reconnect': true,
	'reconnection delay': 500
});

var select = function (selectors) {
	return document.querySelector(selectors);
};

var selectAll = function (selectors) {
	return document.querySelectorAll(selectors);
};

/**
 * Socket.io ON list:
 *	connect
 *	disconnect
 *	recieveMessage
 *		[to, from, message]
 *		Recieve a message from IRC.
 *	initialInfo
 *	ircInfo
 *
 * Socket.io EMIT list:
 *  sendMessage
 *		[channel, message]
 *		Sends a message to a channel.
 *  sendCommand
 *		{type, content}
 *		Send a command.
**/

socket.on('connect', function () {
	client.status.connection = true;

	select('#sidebar header span#status').style.backgroundColor = '#3C9067';

	console.log("Connected to backend.");
});

socket.on('disconnect', function () {
	client.status.connection = false;
	client.status.pastDisconnect = true;

	select('#sidebar header span#status').style.backgroundColor = "#903C3C";

	console.warn("Lost connection to backend.");
});

// IRC
socket.on('initialInfo', function (data) {
	client.nickname = data;
	client.highlights[0] = client.nickname;
});

function channelSetup() {
	// Set up userlist.
	var _channel = client.channels[client.focusedChannel],
		_userList = [],
		_opCount = 0,
		_users = _channel.users;

	for (var k in _users) {
		_userList.push(k);
	}

	_userList.sort(function(a,b) {
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
		select('#users ul').insertAdjacentHTML('beforeend', '<li><span>' + _users[_userList[i]] + '</span>' + _userList[i] + '</li>');

		// Get the op count.
		if (_users[_userList[i]] === "@" || _users[_userList[i]] === "~") {
			_opCount = _opCount+=1;
		}
	}

	// Get user count
	select('#users header p').innerHTML = '';
	select('#users header p').innerHTML = _opCount + " ops, " + Object.keys(_channel.users).length + " total";
}

socket.on('ircInfo', function (data) {
	client.channels = data;
	client.channelList = Object.keys(client.channels);

	// Lets reset the UI!
	select('#channelConsole header input').value = '';
	select('#users > ul').innerHTML = '';
	select('#sidebar > ul').innerHTML = '';

	function updateChannelMenu (element, index) {
		select('#sidebar > ul').insertAdjacentHTML('beforeend', '<li data-type="channel" data-alert="" data-channelNumber="' + index + '"><i class="fa fa-comments-o"></i><span>' + element + '</span></li>');
	}

	client.channelList.forEach(updateChannelMenu);

	if (client.focusedChannel === undefined) {
		client.focusedChannel = client.channelList[0].toLowerCase();
		if (client.channelList[0] !== undefined) {
			select('#sidebar > ul li[data-channelNumber="0"]').classList.add('focusedChannel');
			[].map.call(selectAll('#channelConsole output article[data-channel="' + client.focusedChannel + '"]'), function(obj) {
				obj.style.display = '';
			});
		}
	} else {
		select('#sidebar > ul li[data-channelNumber="' + client.channelList.indexOf(client.focusedChannel) + '"').classList.add('focusedChannel');
	}

	if (client.channels[client.focusedChannel].topic !== undefined) {
		select('#channelConsole header input').value = client.channels[client.focusedChannel].topic;
	} else {
		select('#channelConsole header input').value = '';
	}

	channelSetup();
});

select('#sidebar > ul').onclick = function(event) {
	var items = select('#sidebar > ul').getElementsByTagName('li');
	for (i = 0; i < items.length; i++) {
		items[i].i = i;
		items[i].onclick = function () {
			var theNumber = this.i;
			client.focusedChannel = client.channelList[theNumber].toLowerCase();

			if (client.channels[client.channelList[theNumber]].topic !== undefined) {
				select('#channelConsole header input').value = client.channels[client.channelList[theNumber]].topic;
			} else {
				select('#channelConsole header input').value = '';
			}

			[].map.call(selectAll('#sidebar > ul li'), function(obj) {
				obj.classList.remove('focusedChannel');
			});

			select('#sidebar > ul li:nth-of-type(' + (theNumber+=1) + ')').classList.add('focusedChannel');
			select('#users ul').innerHTML = '';

			// Show messages that are from the focused channel.
			[].map.call(selectAll('#channelConsole output article[data-channel="' + client.focusedChannel + '"]'), function(obj) {
				obj.style.display = '';
			});

			// Hide messages that are not from the focused channel.
			[].map.call(selectAll('#channelConsole output article:not([data-channel="' + client.focusedChannel + '"])'), function(obj) {
				obj.style.display = 'none';
			});

			channelSetup();
		};
	}
};

function displayMessage (data) {
	var message = data.message
		// Filter mean characters out and replace them with nice ones. We don't want mean characters.
		.replace(/&/g, "&amp;")
		.replace(/"/g, '&quot;')
		.replace(/'/g, "&apos;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;"),
		scrollInfoView,
		// Create the timestamp.
		messageTime = new Date(),
		timestamp = "[" + ("0" + messageTime.getHours()).slice(-2) + ":" + ("0" + messageTime.getMinutes()).slice(-2) + ":" + ("0" + messageTime.getSeconds()).slice(-2) + "]",
		highlightMessageTypes = ["message", "action", "notice"],
		isInHighlightList = false;


	// Linkify raw links.
	function linkify (input) {
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return input.replace(exp, "<a href='$1' target='_blank'>$1</a>");
	}

	message = linkify(message);

	for (var i = 0; i < highlightMessageTypes.length && !isInHighlightList; i+=1) {
		if (highlightMessageTypes[i] == data.messageType) {
			isInHighlightList = true;
		}
	}

	if (isInHighlightList) {
		var highlightNick = function (name, input) {
			var exp = new RegExp('\\b(' + name + ')', 'ig');
			return input.replace(exp, '<span class="highlighted">$1</span>');
		};

		for (var i = 0; i < client.highlights.length; i++) {
			message = highlightNick(client.highlights[i], message);
		}
	}

	// If there is no specified channel just use the one the client is currently focused on.
	if (typeof data.channel === 'undefined') {
		data.channel = client.focusedChannel;
	}

	// If scrolled at the bottom set scrollIntView as true.
	if (select('#channelConsole output').scrollHeight - select('#channelConsole output').scrollTop === select('#channelConsole output').clientHeight) {
		scrollInfoView = true;
	}

	select('#channelConsole output').insertAdjacentHTML('beforeend', '<article class="consoleMessage" data-messageType="' + data.messageType + '" data-channel="' + data.channel.toLowerCase() + '"><aside><time>' + timestamp + '</time><span>' + data.head + '</span></aside><p>' + message + '</p></article>');

	// Hide messages not from the focused channel
	[].map.call(selectAll('#channelConsole output article:not([data-channel="' + client.focusedChannel + '"])'), function(obj) {
		obj.style.display = 'none';
	});


	//Scroll to bottom unless the user is scrolled up
	if (scrollInfoView) {
		select('#channelConsole output').scrollTop = select('#channelConsole output').scrollHeight;
	}
}

socket.on('recieveMessage', function (data) {
	switch (data.type) {
		case "message":
			displayMessage({
				messageType: "message",
				head: data.nick,
				channel: data.channel,
				message: data.message
			});
			break;
		case "serverMessage":
			displayMessage({
				messageType: "serverMessage",
				head: "*",
				channel: "server",
				message: data.message
			});
			break;
		case "join":
			displayMessage({
				messageType: "join",
				head: "*",
				channel: data.channel,
				message: data.nick + " (" + data.info.host + ") has joined " + data.channel
			});
			break;
		case "part":
			displayMessage({
				messageType: "part",
				head: "*",
				channel: data.channel,
				message: data.nick + " (" + data.info.host + ") has left " + data.channel
			});
			break;
		case "quit":
			displayMessage({
				messageType: "quit",
				head: "*",
				channel: data.channel,
				message: data.nick + " (" + data.info.host + ") has quit " + data.channels + " (" + data.reason + ")"
			});
			break;
		case "notice":
			displayMessage({
				messageType: "notice",
				head: "-" + data.nick + "-",
				channel: data.channel,
				message: data.message
			});
			break;
		case "nickChange":
			for (var i = data.channels.length - 1; i >= 0; i--) {
				displayMessage({
					messageType: "nickChange",
					head: "&gt;",
					channel: data.channels[i],
					message: data.oldNick + " is now known as " + data.newNick
				});
			}

			// Check to see if it's you that changed nick and update it on the client.
			if (data.oldNick === client.nickname) {
				client.nickname = data.newNick;
				select('#sidebar footer p').innerHTML = client.nickname;
			}
			break;
		case "topicChange":
			displayMessage({
				messageType: "topicChange",
				head: "&gt;",
				channel: data.channel,
				message: data.nick + ' has changed the topic to: "' + data.topic + '"'
			});
			break;
	}
});

var irc = {
	sendMessage: function (data) {
		if (data === '') {
			return;
		} else if (data.substring(0, 1) != "/") {
			// It's not a command.
			socket.emit('sendMessage', [client.focusedChannel, data]);
			// Display it in the client.
			displayMessage({
				messageType: "message",
				head: client.nickname,
				message: data
			});
		} else {
			// It's a command.
			data = data.substring(1, data.length);

			var command = data.split(" ")[0],
				_message = data.substring(command.length+=1, data.length),
				commandList = ['me', 'join', 'part', 'whois', 'notice', 'away'],
				commandFound = false;

			// Check to see if the command is in commandList.
			for (var i = 0; i < commandList.length && !commandFound; i++) {
				if (commandList[i] == command) {
					commandFound = true;
				}
			}

			// It's not a command.
			if (!commandFound) {
				displayMessage({
					messageType: "log",
					head: "**",
					message: 'Sorry, "' + command + '" is not a recognized command.'
				});
				return;
			}

			// It is a command so lets run it!
			switch (command) {
				case "me":
					socket.emit('sendCommand', {
						type: "action",
						channel: client.focusedChannel,
						message: _message
					});
					displayMessage({
						messageType: "action",
						head: "&raquo;",
						message: client.nickname + " " + _message
					});
					break;
				case "join":
					var _channels = _message.split(" ");
					for (var i = 0; i < _channels.length; i+=1) {
						socket.emit('sendCommand', {
							type: "join",
							content: _channels[i]
						});
					}
					break;
				case "part":
					var _channels = _message.split(" ");
					for (var i = 0; i < _channels.length; i+=1) {
						socket.emit('sendCommand', {
							type: "part",
							content: _channels[i]
						});
					}
					break;
				case "notice":
					socket.emit('sendCommand', {
						type: "notice",
						channel: client.focusedChannel,
						message: _message
					});
					displayMessage({
						messageType: "notice",
						head: "-" + client.nickname + "-",
						message: client.nickname + " " + _message
					});
					break;
				case "away":
					socket.emit('sendCommand', {
						type: "away",
						message: _message
					});
					break;
				case "help":
					socket.emit('sendCommand', {
						type: "away",
						message: _message
					});
					break;
				case "topic":
					socket.emit('sendCommand', {
						type: "topic",
						channel: client.focusedChannel,
						message: _message
					});
					break;
			}
		}

		select('#channelConsole footer input').value = "";
	}
};

socket.on('networkName', function (data) {
	select('#sidebar h2').innerHTML = data;
});

// Press enter in chat box
select('#channelConsole footer input').onkeydown = function (event) {
	switch (event.which) {
		case 9: // Tab
			event.preventDefault();
			// TODO: Tab completion.
			break;
		case 13: // Enter
			irc.sendMessage(select('#channelConsole footer input').value);
			break;
	}
};

select('#channelConsole footer button').onclick = function () {
	irc.sendMessage(select('#channelConsole footer input').value);
};

select('#sidebar footer > button').onclick = function () {

	if (!client.away) {
		select('#sidebar footer > button span').style.backgroundColor = '#908B3C';
		socket.emit('sendCommand', {
			type: "away",
			message: client.settings.awayMessage
		});
	} else {
		select('#sidebar footer > button span').style.backgroundColor = '#3C9067';
		socket.emit('sendCommand', {
			type: "away",
			message: ''
		});
	}

	client.away = !client.away;
};
