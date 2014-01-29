var client = {
	server: document.domain,
	status: {
		connection: false,
		pastDisconnect: false
	},
	focusedChannel: "",
	channels: [],
	nickname: "",
	channelList: ""
}

if (typeof String.prototype.startsWith != 'function') { // Thanks to http://stackoverflow.com/a/646643/2152712
	String.prototype.startsWith = function (str) {
		return this.indexOf(str) == 0;
	};
}

var socket = io.connect('http://' + client.server + ':4848', {
	'reconnect': true,
	'reconnection delay': 500
});

/**
 * Socket.io ON list
 *	connect
 *	disconnect
 *	recieveMessage
 *		[to, from, message]
 *		Recieve a message from IRC.
 *
 * Socket.io EMIT list
 *  sendMessage
 *		[channel, message]
 *		Sends a message to a channel.
 *  sendCommand
 *		{type, content}
 * 		Send a command.
 * 
**/

socket.on('connect', function () {
	client.status.connection = true;

	$('#sidebar footer span')
		.css('background-color', '#3C9067')
		.html("Connected");

	console.log("Connected to backend.");
});

socket.on('disconnect', function () {
	client.status.connection = false;
	client.status.pastDisconnect = true;
	
	$('#sidebar footer span')
		.css('background-color', '#903C3C')
		.html("Disconnected");

	console.warn("Lost connection to backend.");
});

// IRC
socket.on('initialInfo', function (data) {
	client.nickname = data;
});

socket.on('ircInfo', function (data) {
	client.channels = data;
	client.channelList = Object.keys(client.channels);

	$('#sidebar > ul').empty();
	function updateChannelMenu (element, index) {
		$('#sidebar > ul').append('<li data-do=""><i class="fa fa-comments-o"></i><span>' + element + '</span></li>');
	}

	client.channelList.forEach(updateChannelMenu);
	
	if (client.focusedChannel == '') {
		client.focusedChannel = client.channelList[0].toLowerCase();
		$('#sidebar > ul li:nth-of-type(1)').addClass('focusedChannel');
	}

	$('#topic input')
		.val('')
		.val(client.channels[client.focusedChannel].topic);

	$('#users > ul').empty();

	// TODO: Make this organize users based on their ... permissions? I can't remember what it's called I didn't sleep last night sorry.
	var _userList = [],
		_opCount;
	
	for (var k in client.channels[client.focusedChannel].users) { 
		_userList.push(k);
	}
	
	for (var i = 0; i < _userList.length; i++) {
		$('#users ul').append('<li><span>' + client.channels[client.focusedChannel].users[_userList[i]] + '</span>' + _userList[i] + '</li>');

		if (client.channels[client.focusedChannel].users[_userList[i]] !== '') {
			_opCount = _opCount += 1;
		}
	}

	// Get user count
	$('#users header p').empty().html(_opCount + " ops, " + Object.keys(client.channels[client.focusedChannel].users).length + " total");
});

$('#sidebar > ul').on('click', 'li', function () {
	var $index = $('#sidebar > ul li').index(this);
	client.focusedChannel = client.channelList[$index].toLowerCase();
	
	$('#channelConsole header input').val(client.channels[client.channelList[$index]].topic);
	$('#sidebar ul li').removeClass('focusedChannel');
	$('#sidebar ul li:nth-of-type(' + ($index+=1) + ')').addClass('focusedChannel');
	$('#users ul').empty();

	// TODO: Make this organize users based on their ... permissions? I can't remember what it's called I didn't sleep last night sorry.

	// Set up userlist.
	var _userList = [],
		_opCount = 0;
	
	for (var k in client.channels[client.focusedChannel].users) { 
		_userList.push(k);
	}
	
	for (var i = 0; i < _userList.length; i++) {
		$('#users ul').append('<li><span>' + client.channels[client.focusedChannel].users[_userList[i]] + '</span>' + _userList[i] + '</li>');

		// Todo: Make this actually get the number of ops and just not he number of people who have a non blank.... permission??? I really need to figure out what it's called.
		// Get the op count.
		if (client.channels[client.focusedChannel].users[_userList[i]] === "@" || client.channels[client.focusedChannel].users[_userList[i]] === "~") {
			_opCount = _opCount+=1;
		}
	}

	// Show messages that are from the focused channel.
	$('#channelConsole output article[data-channel=' + client.focusedChannel + ']').show();
	// Hide messages that are not from the focused channel.
	$("#channelConsole output article:not([data-channel='" + client.focusedChannel + "'])").hide();

	// Get user count
	$('#users header p').empty().html(_opCount + " ops, " + Object.keys(client.channels[client.focusedChannel].users).length + " total");
});

function displayMessage (nameChar, message, channel) {
	// Filter mean characters out and replace them with nice ones. We don't want mean characters.
	var message = message
		.replace(/&/g, "&amp;")
		.replace(/"/g, '&quot;')
		.replace(/'/g, "&apos;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

	// Create the timestamp.
	_declaredTime = new Date(),
	_time = _declaredTime.getTime() / 1000,
	_hours = (parseInt(_time / 3600) % 24) - (_declaredTime.getTimezoneOffset() / 60),
	_minutes = parseInt(_time / 60) % 60,
	_seconds = parseInt(_time % 60, 10),
	_timeStamp = '[' + (_hours < 10 ? "0" + _hours : _hours) + ':' + (_minutes < 10 ? "0" + _minutes : _minutes) + ':' + (_seconds < 10 ? "0" + _seconds : _seconds) + ']';

	if (channel == null) {
		channel = client.focusedChannel;
	}

	$('#channelConsole output').append('<article class="consoleMessage" data-channel="' + channel.toLowerCase() + '"><aside><time>' + _timeStamp + '</time><span>' + nameChar + '</span></aside><p>' + message + '</p></article>');

	$("#channelConsole output article:not([data-channel='" + client.focusedChannel + "'])").hide();
}

socket.on('recieveMessage', function (data) {
	displayMessage(data[1], data[2], data[0]);
});

var irc = {
	sendMessage: function (data) {
		if (data === '') {
			return;
		} else if (!data.startsWith("/")) {
			// It's not a command.
			socket.emit('sendMessage', [client.focusedChannel, data]);
			// HTML to plaintext... kinda.
			// Display it in the console.
			displayMessage(client.nickname, data);
		} else {
			// It's a command.
			data = data.substring(1, data.length);

			var command = data.split(" ")[0],
				_message = data.substring(command.length+=1, data.length),
				commandList = ['me', 'join', 'part', 'whois'],
				commandFound = false;

			// Check to see if the command is in commandList.
			for (i = 0; i < commandList.length && !commandFound; i++) {
				if (commandList[i] == command) {
					commandFound = true;
				}
			}

			// It's not a command.
			if (!commandFound) {
				alert('Invalid comamnd.');
				return;
			}

			// It is a command so lets run it!
			switch (command) {
				case "me":
					socket.emit('sendCommand', {type: "me", channel: client.focusedChannel, content: _message});
					displayMessage("&gt;", _message);
					break;
				case "join":
					var _channels = _message.split(" ");
					for (i = 0; i < _channels.length; i+=1) {
						socket.emit('sendCommand', {type: "join", content: _channels[i]});
					}
					break;
				case "part":
					var _channels = _message.split(" ");
					for (i = 0; i < _channels.length; i+=1) {
						socket.emit('sendCommand', {type: "part", content: _channels[i]});
					}
					break;
			}
		}

		$('#channelConsole footer input')[0].value = "";
	}
}

// Press enter in chat box
$('#channelConsole footer input').keyup(function (e) {
	if (e.keyCode == 13) {
		irc.sendMessage($('#channelConsole footer input')[0].value);
	}
});

$('#channelConsole footer button').click(function () {
	irc.sendMessage($('#channelConsole footer input')[0].value);
});
