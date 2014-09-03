var maidSession = function (app, io) {
	// Requirements
	irc = require("irc"),
	uuid = require("uuid"),
	// Maid Requirements
	maidClient = require("./maidClient");

	// Define the express routes.
	app.route("/").get(function (req, res) {
		res.render("index", {});
	});

	app.route("/preview").get(function (req, res) {
		res.render("client", {}); // Go to /preview to preview the client without connecting to IRC.
	});

	var connectInfo;

	// They requested the client! Lets handle that information and start a new irc session.
	app.post("/client", function (req, res) {
		// Send some initial info so the page is just not completly blank with no indication that it worked.
		res.render("client", {
			server: req.body.server,
			name: req.body.name
		});

		// Handle the login information and create an IRC connection.
		connectInfo = req.body;

		delete connectInfo.submit;

		// Clean up the connection info
		if (!connectInfo.realName) connectInfo.realName = "MaidIRC";
		if (!connectInfo.port) connectInfo.port = 6667;
		if (!connectInfo.sslToggle || connectInfo.sslToggle == "undefined") {
			connectInfo.sslToggle = false;
		} else if (connectInfo.sslToggle == 'on') {
			connectInfo.sslToggle = true;
		} else {
			connectInfo.sslToggle = false;
		}

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
	});

	function createClient (connectInfo, socket) {
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

module.exports = maidSession;
