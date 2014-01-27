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

	$('#connectionStatus')
		.css('background-color', '#4eaa46')
		.html("Connected");

	console.log("Connected to backend.");
});

socket.on('disconnect', function () {
	client.status.connection = false;
	client.status.pastDisconnect = true;
	
	$('#connectionStatus')
		.css('background-color', '#c83c3c')
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

	$('#sidebar nav ul').empty();
	function updateChannelMenu (element, index) {
		$('#sidebar nav ul').append('<li data-do=""><i class="fa fa-comments-o"></i><span>' + element + '</span></li>');
	}

	client.channelList.forEach(updateChannelMenu);
	
	if (client.focusedChannel == '') {
		client.focusedChannel = client.channelList[0];
		$('#sidebar nav ul li:nth-of-type(1)').addClass('focusedChannel');
	}

	$('#topic input')
		.val('')
		.val(client.channels[client.focusedChannel].topic);

	$('#users ul').empty();

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
	$('#channelUserCount').empty().html('<p>' + _opCount + " ops, " + Object.keys(client.channels[client.focusedChannel].users).length + " total</p>");
});

$('#sidebar nav ul').on('click', 'li', function () {
	var $index = $('#sidebar nav ul li').index(this);
	client.focusedChannel = client.channelList[$index];
	
	$('#topic input').val(client.channels[client.channelList[$index]].topic);
	$('#sidebar nav ul li').removeClass('focusedChannel');
	$('#sidebar nav ul li:nth-of-type(' + ($index+=1) + ')').addClass('focusedChannel');
	$('#users ul').empty();

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
	$('#channelUserCount').empty().html('<p>' + _opCount + " ops, " + Object.keys(client.channels[client.focusedChannel].users).length + " total</p>");
});

socket.on('recieveMessage', function (data) {
	$('#consoleOutput').append('<article class="consoleMessage" data-channel="' + data[0] + '"><aside><time>' + getTimeStamp() + '</time><span>' + data[1] + '</span></aside><p>' + data[2] + '</p></article>');
	$("#consoleOutput article:not([data-channel='" + client.focusedChannel + "'])").hide();
});

function getTimeStamp () {
	_declaredTime = new Date(),
	_time = _declaredTime.getTime() / 1000,
	_hours = (parseInt(_time / 3600) % 24) - (_declaredTime.getTimezoneOffset() / 60),
	_minutes = parseInt(_time / 60) % 60,
	_seconds = parseInt(_time % 60, 10),
	_timeStamp = '[' + (_hours < 10 ? "0" + _hours : _hours) + ':' + (_minutes < 10 ? "0" + _minutes : _minutes) + ':' + (_seconds < 10 ? "0" + _seconds : _seconds) + ']';

	return _timeStamp;
}

var irc = {
	sendMessage: function (data) {
		if (data === '') {
			return;
		} else if (!data.startsWith("/")) {
			// It's not a command.
			socket.emit('sendMessage', [client.focusedChannel, data]);
			// HTML to plaintext... kinda.
			var _message = data
				.replace(/&/g, "&amp;")
				.replace(/"/g, '&quot;')
				.replace(/'/g, "&apos;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;");
			// Display it in the console.
			$('#consoleOutput').append('<article class="consoleMessage" data-channel="' + client.focusedChannel + '"><aside><time>' + getTimeStamp() + '</time><span>' + client.nickname + '</span></aside><p>' + _message + '</p></article>');
			$("#consoleOutput article:not([data-channel='" + client.focusedChannel + "'])").hide();
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
					var _now = new Date();
					$('#consoleOutput').append('<article class="consoleMessage" data-channel="' + client.focusedChannel + '"><aside><time>' + getTimeStamp() + '</time><span>&gt;</span></aside><p>' + client.nickname + ' ' + _message + '</p></article>');
					$("#consoleOutput article:not([data-channel='" + client.focusedChannel + "'])").hide();
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

		$('#consoleInput input')[0].value = "";
	}
}

// Press enter in chat box
$('#consoleInput').keyup(function (e) {
	if (e.keyCode == 13) {
		irc.sendMessage($('#consoleInput input')[0].value);
	}
});

$('#consoleInput button').click(function () {
	irc.sendMessage($('#consoleInput input')[0].value);
});
