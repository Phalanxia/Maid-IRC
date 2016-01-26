'use strict';

function maidSession(app, env, version) {
	// Define the express routes.
	app.route('/').get((req, res) => {
		res.render('client', {
			env,
			version,
		});
	});
}

module.exports = maidSession;
