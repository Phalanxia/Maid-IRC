var maidIrc = function (io) {
	"use strict";

	var irc = require("irc"),
		createdClients = [],
		allClients = [];

	function createClient (socket, info) {
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
			console.log(message);
			socket.emit("raw", message);
		});

		client.on("error", function (message) {
			console.log("Node-IRC Error: " + message);
		});

		return client;
	}

	io.sockets.on("connection", function (socket) {
		var i,
			thisClient,
			connectInfo = false;

		console.log("Client connected from: " + socket.handshake.address);

		socket.on("connectInfo", function (data) {
			if (typeof data === undefined) {
				socket.disconnect('unauthorized');
			} else {
				connectInfo = data;
				thisClient = createClient(socket, connectInfo);

				allClients.push(socket);
				createdClients.push(thisClient);

				socket.on("disconnect", function (reason) {
					console.log("Client disconnected: " + reason);
					i = allClients.indexOf(socket);
					allClients.splice(i, 1);

					i = createdClients.indexOf(thisClient);
					createdClients.splice(i, 1);
				});
			}
		});
	});
};

module.exports = maidIrc;
