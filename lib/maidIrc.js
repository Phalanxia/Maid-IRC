"use strict";

var irc = require("irc");
var allClients = [];

var maidIrc = function (io) {
	function createClient (socket, info, clientId) {
		// Start up the irc client
		var client = new irc.Client(info.server, info.nick, {
			channels: [info.channel],
			userName: info.nick,
			password: info.nicknamePassword,
			realName: info.realName,
			port: info.port,
			floodProtection: true,
			floodProtectionDelay: 1000,
			autoRejoin: true,
			autoConnect: true,
			secure: false,
			selfSigned: false,
			certExpired: false,
			sasl: false,
			stripColors: true,
			messageSplit: 512
		});

		client.on("abort", function () {
			socket.emit("error", {
				type: "connection"
			});
		});

		// We're just gonna handle all the messages with this instead of using the built in listeners that are part of node-irc
		client.on("raw", function (message) {
			socket.emit("raw", [clientId, message]);
		});

		client.on("error", function (message) {
			console.log("Node-IRC Error: " + JSON.stringify(message));
		});

		return client;
	}


	io.sockets.on("connection", function (socket) {
		var i, thisClient = {}; // i should be renamed

		console.log("Client connected from: " + socket.handshake.address);

		socket.on("connectToNetwork", function (data) {
			if (typeof data === undefined) {
				socket.disconnect("unauthorized");
			} else {
				var networkName = data[0].name,
					options = data[0].options,
					connectionId = data[1];

				thisClient[connectionId] = createClient(socket, data[0], connectionId);

				socket.on("disconnect", function (reason) {
					console.log("Client disconnected: " + reason);

					thisClient[connectionId].disconnect("Connection closed");

					delete thisClient[connectionId]; // or however you delete from a dictionary
				});

				i = allClients.push(socket);
			}
		});

		socket.on("disconnectFromNetwork", function (id) {
			// needs error checking
			thisClient[id].disconnect(); // Or however you do that.
			delete thisClient[id]; // or however you delete from a dictionary
		})

		// Find the correct event for a socket disconnection.
		socket.on("actual-disconnect-from-socket-event-this-is-probably-not-the-right-name-maybe-ish-perhaps", function(data) {
			Object.keys(thisClient, function(key) {
				thisClient[key].disconnect() // Or however you do that. :P
			})
			allClients.splice(i, 1);
		});
	});
};

module.exports = maidIrc;
