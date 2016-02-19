'use strict';

// Maid IRC modules
const MaidWebServer = require('./modules/webServer');
const helpers = require('./modules/helpers');

// package.json
const pjson = require('../../package.json');

class Server {
	constructor(options) {
		this.options = options;
	}

	start() {
		process.title = 'Maid-IRC';

		let protocol = '';

		if (this.options.http.enabled) {
			protocol = 'HTTP';
		}

		if (this.options.https.enabled) {
			if (protocol !== '') {
				protocol = `${protocol}, HTTPS`;
			} else {
				protocol = 'HTTPS';
			}
		}

		console.log(`Starting Maid-IRC.
Environment: ${this.options.NODE_ENV}
Web Servers: ${protocol}`);

		// Start the web server
		const webServer = new MaidWebServer(this.options, pjson).init();

		// Technical
		process.on('SIGINT', () => {
			helpers.stop('SIGINT');
		});

		if (this.options.NODE_ENV === 'test') {
			// Close after seccessfully getting to everything above without crashing
			helpers.stop('Maid-IRC seems to have started successfully');
		}
	}
}

module.exports = Server;
