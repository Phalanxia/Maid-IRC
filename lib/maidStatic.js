var maidSession = function (app) {
	"use strict";
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
		// Send some initial info so the page is just not completely blank with no indication that it worked.
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
	});
};

module.exports = maidSession;
