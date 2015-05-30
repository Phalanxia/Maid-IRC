var maidSession = function (app) {
	"use strict";

	// Define the express routes.
	app.route("/").get(function (req, res) {
		// Fetch the version number for the about page.
		var pjson = require('../package.json').version;

		res.render("client", {version: pjson});
	});
};

module.exports = maidSession;
