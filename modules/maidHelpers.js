var maidHelpers = function () {
	"use strict";

	var helpers = function () { };

	helpers.prototype.stopMaid = function (reason) {
		if (reason) {
			reason = " Reason: " + reason;
		} else {
			reason = "";
		}

		console.log("\nGracefully shutting down." + reason);
		process.exit();
	}

	return new helpers();
};

module.exports = maidHelpers();
