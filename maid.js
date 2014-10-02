var env = process.env.NODE_ENV || 'production';

console.log("Starting Maid IRC.\nEnvironment: " + env);

// Check to see if it is a supported environment variable
if (["production", "development", "debug"].indexOf(env.toLowerCase()) < 0) {
	console.warn('Sorry! NODE_ENV: "' + env + '" is not recognized. Try "development" or "production".');
}

var http = require("http"),
	express = require("express"),
	fs = require("fs"),
	// Middleware
	favicon = require("serve-favicon"),
	bodyParser = require("body-parser"),
	methodOverride = require('method-override'),
	lessMiddleware = require('less-middleware'),
	compression = require('compression'),
	// Maid IRC libs
	maidStatic = require("./lib/maidStatic"),
	maidIrc = require("./lib/maidIrc"),
	// Less middleware variables
	forceCompile = false,
	lessDebug = false;

// Define express for the next part
var app = express();
app.use(compression());

// Do things depending on which environment were in
switch (env) {
	case "development":
		var morgan = require("morgan");
		app.use(morgan("dev"));
		// Set less middleware variables
		forceCompile = true;
		lessDebug = true;
		break;
	case "production":
		var minify = require("express-minify");
		app.use(minify());
		break;
	case "debug":
		// For socket.io debug
		break;
}

// Get config
var config = require("./config.js");

// Set up express
app.set("views", __dirname + "/views");
app.set("view engine", "jade");

// Middleware
app.use(require("errorhandler")());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(methodOverride());

// Set up less.css middleware
app.use(lessMiddleware(__dirname + "/less", {
	dest: __dirname + "/public",
	compiler: {
		compress: true,
		sourceMap: true,
		yuicompress: true
	},
	preprocess: {
		path: function (pathname, req) {
			return pathname.replace("css\\", "");
		}
	},
	parser: {
		optimization: 2
	},
	debug: lessDebug,
	force: forceCompile
}));

app.use(express.static(__dirname + "/public", {
	maxAge: "1w"
}));
app.use(favicon(__dirname + "/public/img/icons/favicon.ico"));

// Define server
var server = http.createServer(app).listen(config.http_port, config.http_host),
	// Set up socket.io
	io = require("socket.io").listen(server);

// Now that thats done with lets pass it of to maidStatic.js and maidIrc.js
maidStatic(app);
maidIrc(io);
