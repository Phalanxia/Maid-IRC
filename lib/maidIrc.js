var maidIrc = function (io) {
	"use strict";

	// Requirements
	var irc = require("irc");

	var i,
		createdClients = [], // For testing
		allClients = [];

	io.sockets.on("connection", function (socket) {
		var thisClient = createClient(connectInfo, socket);

		allClients.push(socket);
		createdClients.push(thisClient);

		console.log("Client connected from: " + socket.handshake.address.address + ":" + socket.handshake.address.port);

		socket.emit("initialInfo", req.body.name);

		socket.on("disconnect", function () {
			i = allClients.indexOf(socket);
			allClients.splice(i, 1);

			i = createdClients.indexOf(thisClient);
			createdClients.splice(i, 1);
		});
	});

	function createClient (io, connectInfo) {
		// Start up the irc client
		var client = new irc.Client(connectInfo.server, connectInfo.name, {
			channels: [connectInfo.channel],
			userName: connectInfo.name,
			password: connectInfo.nicknamePassword,
			realName: connectInfo.realName,
			port: connectInfo.port,
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
			// delete client;

			socket.emit("error", {
				type: "connection"
			});
		});

		// We're just gonna handle all the messages with this instead of using the built in listeners that are part of node-irc
		client.on("raw", function (message) {
			maidClient(message, irc, socket);
			socket.emit("raw", message);
		});

		client.on("error", function (message) {
			console.log(message);
		});

		console.log("if it reconnects here then...");
		return client;
	}
};

module.exports = maidIrc;
