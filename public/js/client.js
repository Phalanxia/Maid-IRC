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
});

$('#sidebar nav ul').on('click', 'li', function () {
	var $index = $('#sidebar nav ul li').index(this);
	client.focusedChannel = client.channelList[$index];
	$('#topic input').val(client.channels[client.channelList[$index]].topic);
	$('#sidebar nav ul li').removeClass('focusedChannel');
	$('#sidebar nav ul li:nth-of-type(' + ($index+=1) + ')').addClass('focusedChannel');
});

socket.on('recieveMessage', function (data) {
	// TODO: Redo how the timestamps works. It's pretty bad at the moment.
	var _now = new Date();
	$('#consoleOutput').append('<article class="consoleMessage" data-channel="' + data[0] + '"><aside><time>[' + _now.getHours() + ':' + _now.getMinutes() + ':'+ _now.getSeconds() + ']</time><span>' + data[1] + '</span></aside><p>' + data[2] + '</p></article>');
	$("#consoleOutput article:not([data-channel='" + client.focusedChannel + "'])").hide();
});

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
				.replace(/>/g, "&gt;"),
				_now = new Date();
			// Display it in the console.
			$('#consoleOutput').append('<article class="consoleMessage" data-channel="' + client.focusedChannel + '"><aside><time>[' + _now.getHours() + ':' + _now.getMinutes() + ':'+ _now.getSeconds() + ']</time><span>' + client.nickname + '</span></aside><p>' + _message + '</p></article>');
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
					$('#consoleOutput').append('<article class="consoleMessage" data-channel="' + client.focusedChannel + '"><aside><time>[' + _now.getHours() + ':' + _now.getMinutes() + ':'+ _now.getSeconds() + ']</time><span>&gt;</span></aside><p>' + client.nickname + ' ' + _message + '</p></article>');
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
