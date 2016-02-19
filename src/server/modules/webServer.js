'use strict';

// Requirements
const http = require('http');
const https = require('https');
const express = require('express');
const io = require('socket.io');
const fs = require('fs');

// Middleware
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const compression = require('compression');

// Maid-IRC modules
const maidIrc = require('./maidIrc');

class WebServer {
	constructor(options, pjson) {
		this.options = options;
		this.pjson = pjson;
	}

	init() {
		const app = express();
		app.use(compression());

		// Do enviroment specific tasks
		switch (this.options.NODE_ENV) {
			case 'development':
				app.use(require('morgan')('dev'));
				app.use(require('errorhandler')());
				break;
			case 'production':
				app.use(require('express-minify')());
				break;
			case 'debug':

				// For socket.io debug
				break;
			case 'test':
				break;
			default:
				console.warn(`Sorry! NODE_ENV "${this.options.NODE_ENV}" is not recognized. Try "development" or "production".`);
				break;
		}

		// Set up express
		app.set('views', `${__dirname}/../views`);
		app.set('view engine', 'jade');

		// Middleware
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({
			extended: true,
		}));
		app.use(methodOverride());

		app.use(express.static(`${__dirname}/../../client`, {
			maxAge: '1w',
		}));
		app.use(favicon(`${__dirname}/../../client/img/icons/favicon.ico`));

		// Define server
		if (this.options.http.enabled) {
			const server = http.createServer(app).listen(this.options.http.port, this.options.host);

			maidIrc(io.listen(server), this.options.NODE_ENV);
		}

		if (this.options.https.enabled && this.options.https.private_key && this.options.https.certificate) {
			const server = https.createServer({
				key: fs.readFileSync(this.options.https.private_key),
				cert: fs.readFileSync(this.options.https.certificate),
			}, app).listen(this.options.https.port, this.options.host);

			maidIrc(io.listen(server), this.options.NODE_ENV);
		}

		// Define the express routes
		app.route('/').get((req, res) => {
			res.render('client', {
				env: this.options.NODE_ENV,
				version: this.pjson.version,
			});
		});
	}
}

module.exports = WebServer;
