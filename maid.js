'use strict';

let argEnv;
process.argv.forEach((val, index) => {
	const parsed = val.split('=');
	if (parsed[0] === 'env') {
		argEnv = parsed[1];
	}
});

const env = process.env.NODE_ENV || argEnv || 'production';
const config = require('./config.js');

console.log(`Starting Maid-IRC.\nEnvironment: ${env}\nHost: ${config.HTTP_HOST}\nPort: ${config.HTTP_PORT}\n`);

// Requirements
const http = require('http');
const express = require('express');
const path = require('path');

// Middleware
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const compression = require('compression');

// Maid IRC modules
const maidStatic = require('./modules/maidStatic');
const maidIrc = require('./modules/maidIrc');
const maidHelpers = require('./modules/maidHelpers');

// Define express for the next part
const app = express();
app.use(compression());

// Do things depending on which environment were in
switch (env) {
	case 'development':
		const morgan = require('morgan');
		app.use(morgan('dev'));
		app.use(require('errorhandler')());
		break;
	case 'production':
		const minify = require('express-minify');
		app.use(minify());
		break;
	case 'debug':
		// For socket.io debug
		break;
	case 'test':
		break;
	default:
		console.warn(`Sorry! NODE_ENV "${env}" is not recognized. Try "development" or "production".`);
		break;
}

// Set up express
app.set('views', `${__dirname}/views`);
app.set('view engine', 'jade');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true,
}));
app.use(methodOverride());

app.use(express.static(`${__dirname}/public`, {
	maxAge: '1w',
}));
app.use(favicon(`${__dirname}/public/img/icons/favicon.ico`));

// Define server
const io = require('socket.io');

function httpServer() {
	const server = http.createServer(app).listen(config.HTTP_PORT, config.HTTP_HOST);
	maidIrc(io.listen(server), env);
}

function httpsServer() {
	const server = http.createServer({
		key: config.PRIVATE_KEY,
		cert: config.CERTIFICATE,
	}, app).listen(config.HTTPS_PORT, config.HTTP_HOST);
	maidIrc(io.listen(server), env);
}

// If HTTPS
if (config.ENABLE_HTTPS >= 1) {
	if (config.PRIVATE_KEY && config.CERTIFICATE) {
		switch (config.ENABLE_HTTPS) {
		case 1: // Both HTTP and HTTPS
			httpServer();
			httpsServer();
			break;
		case 2: // HTTPS only
			httpsServer();
			break;
		default: // Typo? :p
			console.warn('The setting in ENABLE_HTTPS in config.js only accepts 0-2. Starting in HTTPS only mode.');
			httpsServer();
			break;
		}
	} else {
		maidHelpers.stopMaid('To use HTTPS, PRIVATE_KEY and certificate both need to be set in config.js!');
	}
} else { // If HTTP only
	httpServer();
}

// Now that thats done with lets pass it of to maidStatic.js and maidIrc.js
maidStatic(app, env);

// Technical
process.on('SIGINT', () => {
	maidHelpers.stopMaid('SIGINT');
});

// Close Maid-IRC after seccessfully getting to everything above without crashing. (This is probably a really bad way of handling this)
if (env === 'test') {
	maidHelpers.stopMaid('Maid-IRC seems to have started successfully');
}
