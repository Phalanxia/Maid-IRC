var maidSession = function (app) {
	"use strict";

	// Define the express routes.
	app.route("/").get(function (req, res) {
		res.render("client", {});
	});
};

module.exports = maidSession;
