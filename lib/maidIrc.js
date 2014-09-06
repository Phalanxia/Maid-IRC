var maidIrc = function (io) {
	"use strict";

	// Requirements
	var irc = require("irc");

	var createdClients = [],
		allClients = [];

	io.sockets.on("connection", function (socket) {
		var i,
			thisClient,
			connectInfo = false;

		socket.on("connectInfo", function (data) {
			console.log("Connect Infomation: " + JSON.stringify(data));
			if (typeof data == undefined) {
				socket.disconnect('unauthorized');
				return;
			} else {
				connectInfo = data;
				thisClient = createClient(socket, connectInfo);

				allClients.push(socket);
				createdClients.push(thisClient);

				console.log("Client connected from: " + socket.handshake.address.address + ":" + socket.handshake.address.port);

				socket.on("disconnect", function () {
					i = allClients.indexOf(socket);
					allClients.splice(i, 1);

					i = createdClients.indexOf(thisClient);
					createdClients.splice(i, 1);
				});
			}
		});
	});

	function createClient (socket, info) {
		// Start up the irc client
		var client = new irc.Client(info["server"], info["nick"], {
			channels: [info["channel"]],
			userName: info["nick"],
			password: info["nicknamePassword"],
			realName: info["realName"],
			port: info["port"],
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
			console.log(message);
			socket.emit("raw", message);
		});

		client.on("error", function (message) {
			console.log("Node-IRC Error: " + message);
		});

		return client;
	}
};

module.exports = maidIrc;
