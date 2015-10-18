'use strict';

function maidSession(app, env) {
	// Define the express routes.
	app.route('/').get((req, res) => {
		// Fetch the version number for the about page.
		const pjson = require('../package.json').version;

		res.render('client', {
			env,
			version: pjson
		});
	});
}

module.exports = maidSession;
