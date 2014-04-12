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

		// Modules
		var updateInterface = new UpdateInterface();
		var messaging = new Messaging();

		// Lets handle all the socket.io stuff here for now. :3
		var socket = io.connect('http://' + document.domain + ":" + location.port, {
			'reconnect': true,
			'reconnection delay': 500
		});

		socket.on('connect', function () {
			client.status.connection = true;
			console.log("Connected to backend.");
			select('#sidebar header span#status').style.backgroundColor = '#3C9067';
		});

		socket.on('disconnect', function () {
			client.status.connection = false;
			client.status.pastDisconnect = true;
			console.warn("Lost connection to backend.");
			select('#sidebar header span#status').style.backgroundColor = "#903C3C";
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

		// Press enter in chat box
		select('#channelConsole footer input').onkeydown = function (event) {
			switch (event.which) {
				case 9: // Tab
					event.preventDefault();
					// TODO: Tab completion.
					break;
				case 13: // Enter
					messaging.send(socket, select('#channelConsole footer input').value);
					break;
			}
		};

		select('#channelConsole footer button').onclick = function () {
			console.log("rawr");
			messaging.send(socket, select('#channelConsole footer input').value);
		};
	}
};

client.init();
