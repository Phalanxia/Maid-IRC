var client = {
	server: document.domain,
	status: {
		connection: false,
		pastDisconnect: false
	},
	focusedChannel: "",
	channels: [],
	nickname: "",
	highlights: [],
	channelList: ""
};

var socket = io.connect('http://' + client.server + ':4848', {
	'reconnect': true,
	'reconnection delay': 500
});

var select = function (selectors) {
	if (selectors.indexOf(',') != -1) {
		return document.querySelectorAll(selectors);
	} else {
		return document.querySelector(selectors);
	}
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

	select('#sidebar footer span').style.backgroundColor = '#3C9067';
	select('#sidebar footer span').innerHTML = "Connected";

	console.log("Connected to backend.");
});

socket.on('disconnect', function () {
	client.status.connection = false;
	client.status.pastDisconnect = true;

	select('#sidebar footer span').style.backgroundColor = "#903C3C";
	select('#sidebar footer span').innerHTML = "Disconnected";

	console.warn("Lost connection to backend.");
});

// IRC
socket.on('initialInfo', function (data) {
	client.nickname = data;
	client.highlights[0] = client.nickname;
});

socket.on('ircInfo', function (data) {
	client.channels = data;
	client.channelList = Object.keys(client.channels);

	select('#sidebar > ul').innerHTML = '';
	function updateChannelMenu (element, index) {
		select('#sidebar > ul').insertAdjacentHTML('beforeend', '<li data-alert=""><i class="fa fa-comments-o"></i><span>' + element + '</span></li>');
	}

	client.channelList.forEach(updateChannelMenu);

	if (client.focusedChannel === '') {
		client.focusedChannel = client.channelList[0].toLowerCase();
	}

	select('#sidebar > ul li:nth-of-type(1)').classList.add('focusedChannel');
	select('#channelConsole header input').value = '';
	select('#channelConsole header input').value = client.channels[client.focusedChannel].topic;
	select('#users > ul').innerHTML = '';

	// TODO: Make this organize users based on their ... permissions? I can't remember what it's called I didn't sleep last night sorry.
	var _userList = [],
		_opCount = 0;

	for (var k in client.channels[client.focusedChannel].users) {
		_userList.push(k);
	}

	for (var i = 0; i < _userList.length; i++) {
		select('#users ul').insertAdjacentHTML('beforeend', '<li><span>' + client.channels[client.focusedChannel].users[_userList[i]] + '</span>' + _userList[i] + '</li>');

		// Get the op count.
		if (client.channels[client.focusedChannel].users[_userList[i]] === "@" || client.channels[client.focusedChannel].users[_userList[i]] === "~") {
			_opCount = _opCount+=1;
		}
	}

	// Get user count
	select('#users header p').innerHTML = '';
	select('#users header p').innerHTML = _opCount + " ops, " + Object.keys(client.channels[client.focusedChannel].users).length + " total";
});

for (var i = 0, len = select('#sidebar > ul').children.length; i < len; i++) {
	(function(index){
		select('#sidebar > ul').children[i].onclick = function(){
			client.focusedChannel = client.channelList[index].toLowerCase();

			select('#channelConsole header input').value = client.channels[client.channelList[index]].topic;
			select('sidebar > ul li').classList.remove('focusedChannel');
			select('#sidebar > ul li:nth-of-type(' + (index+=1) + ')').classList.add('focusedChannel');
			select('#users ul').innerHTML = '';

			// TODO: Make this organize users based on their ... permissions? I can't remember what it's called I didn't sleep last night sorry.

			// Set up userlist.
			var _channel = client.channels[client.focusedChannel],
				_userList = [],
				_opCount = 0,
				_users = _channel.users;

			for (var k in _users) {
				_userList.push(k);
			}

			for (var i = 0; i < _userList.length; i++) {
				select('#users ul').insertAdjacentHTML('beforeend', '<li><span>' + _users[_userList[i]] + '</span>' + _userList[i] + '</li>');

				// Get the op count.
				if (_users[_userList[i]] === "@" || _users[_userList[i]] === "~") {
					_opCount = _opCount+=1;
				}
			}

			// Show messages that are from the focused channel.
			select('#channelConsole output article[data-channel=' + client.focusedChannel + ']').style.display = '';
			// Hide messages that are not from the focused channel.
			select("#channelConsole output article:not([data-channel='" + client.focusedChannel + "'])").style.display = 'none';

			// Get user count
			select('#users header p').innerHTML = '';
			select('#users header p').innerHTML = _opCount + " ops, " + Object.keys(_channel.users).length + " total";
		};
	})(i);
}


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
	function linkify(input) {
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

	if (select("#channelConsole output article:not([data-channel='" + client.focusedChannel + "'])")) {
		select("#channelConsole output article:not([data-channel='" + client.focusedChannel + "'])").style.display = 'none';
	}

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
				commandList = ['me', 'join', 'part', 'whois', 'notice'],
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
						type: "me",
						channel: client.focusedChannel,
						content: _message
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
						content: _message
					});
					displayMessage({
						messageType: "notice",
						head: "-" + client.nickname + "-",
						message: client.nickname + " " + _message
					});
					break;
			}
		}

		select('#channelConsole footer input').value = "";
	}
};

// Press enter in chat box
select('#channelConsole footer input').onkeydown = function (event) {
	switch (event.which) {
		case 9: // Tab
			event.preventDefault();
			break;
		case 13:
			irc.sendMessage(select('#channelConsole footer input').value);
			break;
	}
};

select('#channelConsole footer button').onclick = function () {
	irc.sendMessage(select('#channelConsole footer input').value);
};
