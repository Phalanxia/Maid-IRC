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
		focusedServer: ""
	},

	getFocused: function () {
		return this.networks[this.networks.focusedServer].focusedSource
	},

	init: function (connectInfo) {
		"use strict";

		var socket = io.connect(window.location.origin, { "reconnect": false });

		// Modules
		var updateInterface = new UpdateInterface(),
			outgoingMessages = new OutgoingMessages(socket, updateInterface),
			incomingMessages = new IncomingMessages(socket, updateInterface),
			connectToNetwork = new ConnectToNetwork(socket, updateInterface);

		connectToNetwork.setup(connectInfo);

		// Respond to pings
		socket.on("ping", function (data) {
			socket.emit("pong", {beat: 1});
		});

		// Lets handle all the socket.io stuff here for now. :3
		socket.on("connect", function () {
			client.status.connection = true;
			console.log("Connected.");
		});

		socket.on("disconnect", function () {
			client.status.connection = false;
			client.status.pastDisconnect = true;
			console.log("Lost connection.");
		});

		// IRC
		socket.on("raw", function (data) {
			var connectionId = data[0],
				message = data[1];

			// Handle different command types differently (normal, reply, error)
			if (message.commandType == "normal") {
				incomingMessages.normal(connectionId, message);
			} else if (message.commandType == "reply") {
				incomingMessages.reply(connectionId, message);
			} else if (message.commandType == "error") {
				incomingMessages.error(connectionId, message);
			} else {
				console.warn("Error: Unknown command type " + '"' + message.commandType + '"');
			}
		});

		function enterMessage () {
			var input = select("#channel-console footer input");
			outgoingMessages.send(input.value);
			input.value = "";
		}

		select("#channel-console footer input").onkeydown = function (event) {
			if (event.which == 13) { // Enter Key
				enterMessage();
			}
		};

		select("#channel-console footer button").onclick = function () {
			enterMessage();
		};
	}
};

// Handle Login Info
select("#submit").onclick = function (event) {
	event.preventDefault();

	var connectInfo = {},
		invalid = false;

	connectInfo = {};
	[].map.call(selectAll("#connect input"), function (obj) {
		connectInfo[obj.name] = obj.value;

		// If the input is no longer invalid remove the invalid class.
		if (obj.classList.contains && obj.validity.valid) {
			obj.classList.remove("invalid");
		}

		// If the input is invalid add the invalid class to the input.
		if (!obj.validity.valid) {
			obj.classList.add("invalid");
			invalid = true;
		}
	});

	if (!invalid) {
		if (!connectInfo.realName.length) {
			connectInfo.realName = connectInfo.nick
		}

		client.init(connectInfo);
		hideModals();
		select("#connect form").reset();
	} else {
		select("#connect").classList.add("invalid");

		setTimeout(function () {
			select("#connect").classList.remove("invalid");
		}, 500);
	}
};
