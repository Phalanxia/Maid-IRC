var select = document.querySelector.bind(document),
	selectAll = document.querySelectorAll.bind(document);

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

	networks: {
		name: "",
		channels: {},
		nick: "",
		channelList: "",
		focusedChannel: ""
	},

	init: function (connectInfo) {
		"use strict";

		var socket = io.connect(window.location.origin, {
			'reconnect': false,
			'reconnection delay': 500
		});

		// Send connect info to the backend
		socket.emit('connectInfo', connectInfo);
		// Set the clients settings
		client.networks.nick = connectInfo.nick;
		client.settings.highlights[0] = client.networks.nick;

		// Modules
		var updateInterface = new UpdateInterface();
		var messaging = new Messaging(socket, updateInterface);

		// Respond to pings
		socket.on('ping', function (data) {
			socket.emit('pong', {beat: 1});
		});

		// Lets handle all the socket.io stuff here for now. :3
		socket.on('connect', function () {
			client.status.connection = true;

			select('#network-panel header span#status').style.backgroundColor = '#3c9067';

			console.log("Connected to backend.");
		});

		socket.on('disconnect', function () {
			client.status.connection = false;
			client.status.pastDisconnect = true;

			select('#network-panel header span#status').style.backgroundColor = "#903c3c";

			console.warn("Lost connection to backend.");
		});

		// IRC
		socket.on('raw', function (data) {
			messaging.recieve(data);
		});

		socket.on('updateInfo', function (data) {
			if ((client.networks.channels[data.channel] === undefined && data.type == "users") || (client.networks.channels[data.channel] == undefined && data.type == "topic") ) {
				return;
			} else {
				switch (data.type) {
					case "channel":
						if (data.action == "join") {
							client.networks.channels[data.channel] = data.channelInfo;
						} else {
							// If the user parted a channel
							delete client.networks.channels[data.channel];
						}
						updateInterface.directory();
						break;
					case "users":
						if (typeof data.action !== "undefined") {
							switch (data.action) {
								case "join":
									client.networks.channels[data.channel].users = data.users;
									break;
								case "part":
									delete client.networks.channels[data.channel].users[data.nick];
									break;
							}
						} else {
						}

						console.log(JSON.stringify(client.networks.channels[data.channel].users = data.users));
						// Update the interface if its the channel the user is focused on.
						if (client.networks.focusedChannel == data.channel) {
							updateInterface.users(data.channel);
						}
						break;
					case "topic":
						client.networks.channels[data.channel].topic = data.topic;
						// Update the interface if its the channel the user is focused on.
						if (client.networks.focusedChannel == data.channel) {
							updateInterface.topic(data.topic);
						}
						break;
				}
			}
		});

		// Press enter in chat box
		select('#channel-console footer input').onkeydown = function (event) {
			switch (event.which) {
				case 13: // Enter
					messaging.send(select('#channel-console footer input').value);
					break;
			}
		};

		select('#channel-console footer button').onclick = function () {
			messaging.send(select('#channel-console footer input').value);
		};

		select('#network-panel footer > button').onclick = function () {
			if (!client.away) {
				select('#network-panel footer > button span').style.backgroundColor = '#908B3C';
				socket.emit('send', ["away", "", client.settings.awayMessage]);
			} else {
				select('#network-panel footer > button span').style.backgroundColor = '#3C9067';
				socket.emit('send', ["away", "", ""]);
			}

			client.away = !client.away;
		};
	}
};

// Handle Login Info
select('#submit').onclick = function (event) {
	event.preventDefault();

	var connectInfo = {},
		name,
		invalid = false;

	[].map.call(selectAll('#login input'), function (obj) {
		name = obj.name;
		connectInfo[name] = obj.value;

		if (!obj.validity.valid) {
			invalid = true;
		}
	});

	if (!invalid) {
		client.init(connectInfo);

		// Add classes for transition
		select('#login').classList.add("connected");
		select('#client').classList.add("connected");
	} else {
		select('#login form').classList.add("invalid");

		setTimeout(function () {
			select('#login form').classList.remove("invalid");
		}, 500);
	}

	event.preventDefault();
};
