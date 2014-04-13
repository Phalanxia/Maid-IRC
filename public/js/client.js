var select = function (selectors) { return document.querySelector(selectors); },
	selectAll = function (selectors) { return document.querySelectorAll(selectors); };

var client = {
	settings: {
		awayMessage: "Away",
		ignoreList: [],
		highlights: []
	},

	status: {
		connection: false,
		pastDisconnect: false,
		away: false
	},

	info: {
		nickname: "",
		channels: [],
		channelList: "",
		focusedChannel: ""
	},

	init: function () {
		"use strict";

		var socket = io.connect('http://' + document.domain + ":" + location.port, {
			'reconnect': true,
			'reconnection delay': 500
		});

		// Modules
		var updateInterface = new UpdateInterface();
		var messaging = new Messaging(socket, updateInterface);

		// Lets handle all the socket.io stuff here for now. :3
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

		// IRC specific.
		socket.on('initialInfo', function (data) {
			client.info.nickname = data;
			client.settings.highlights[0] = client.info.nickname;
		});

		socket.on('recieveMessage', function (data) {
			if (client.settings.ignoreList.indexOf(data.mask) != -1) {
				return;
			} else {
				messaging.recieve(data);
			}
		});

		socket.on('networkName', function (data) {
			select('#sidebar h2').innerHTML = data;
		});

		socket.on('updateInfo', function (data) {
			console.log(JSON.stringify(data));
			switch (data.type) {
				case "channels":
					if (data.action == "join") {
						data.channels[data.channel] = channelInfo;
					} else { // If the user parted a channel
						delete data.channels[data.channel];
					}
					updateInterface.directory[data.channel];
					break;
				case "users":
					client.info.channels[data.channel].users = data.users;
					// Lets update the interface if its the channel the user is focused on.
					if (client.info.focusedChannel == data.channel) {
						updateInterface.users[data.channel];
					}
					break;
				case "topic":
					client.info.channels[data.channel].topic = data.topic;
					// Lets update the interface if its the channel the user is focused on.
					if (client.info.focusedChannel == data.channel) {
						updateInterface.topic[data.topic];
					}
				break;
			}
		});

		// Key inputs

		// Press enter in chat box
		select('#channelConsole footer input').onkeydown = function (event) {
			switch (event.which) {
				case 13: // Enter
					messaging.send(select('#channelConsole footer input').value);
					break;
			}
		};

		select('#channelConsole footer button').onclick = function () {
			messaging.send(select('#channelConsole footer input').value);
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
	}
};

client.init();
