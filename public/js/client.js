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
		socket.on('ping', function (data) {
			socket.emit('pong', {beat: 1});
		});

		// Lets handle all the socket.io stuff here for now. :3
		socket.on('connect', function () {
			client.status.connection = true;
			console.log("Connected.");
		});

		socket.on('disconnect', function () {
			client.status.connection = false;
			client.status.pastDisconnect = true;
			console.log("Lost connection.");
		});

		// IRC
		socket.on('raw', function (data) {
			// console.log(data[1]); // For testing.

			var connectionId = data[0],
				message = data[1];

			// Do certant things depending on the incoming command types (normal, reply, error)
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

		// Press enter in chat box
		select('#channel-console footer input').onkeydown = function (event) {
			if (event.which == 13) { // Enter Key
				messaging.send(select('#channel-console footer input').value);
			}
		};

		select('#channel-console footer button').onclick = function () {
			messaging.send(select('#channel-console footer input').value);
		};
	}
};

var hideModals = function () {
	select("#pageCover").classList.remove("displayed");
	[].map.call(selectAll(".modal"), function(obj) {
		obj.classList.remove("displayed");
	});
};

// Handle Login Info
select('#submit').onclick = function (event) {
	event.preventDefault();

	var connectInfo = {},
		invalid = false;

	connectInfo = {};
	[].map.call(selectAll('#connect input'), function (obj) {
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
		client.init(connectInfo);
		hideModals();
		select("#connect form").reset();
	} else {
		select('#connect').classList.add("invalid");

		setTimeout(function () {
			select('#connect').classList.remove("invalid");
		}, 500);
	}
};
