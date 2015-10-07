'use strict';

function maidSession(app) {
	// Define the express routes.
	app.route('/').get((req, res) => {
		// Fetch the version number for the about page.
		const pjson = require('../package.json').version;

		res.render('client', {version: pjson});
	});
}

module.exports = maidSession;
