var maidSession = function (app) {
	"use strict";

	// Define the express routes.
	app.route("/").get(function (req, res) {
		res.render("index", {});
	});

	app.route("/preview").get(function (req, res) {
		res.render("client", {}); // Go to /preview to preview the client without connecting to IRC.
	});

	// They requested the client! Lets handle that information and start a new irc session.
	app.post("/client", function (req, res) {
		// Send some initial info so the page is just not completely blank with no indication that it worked.
		res.render("client", {
			server: req.body.server,
			name: req.body.name
		});
	});
};

module.exports = maidSession;
