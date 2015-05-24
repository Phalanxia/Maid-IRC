var parsed,
	argEnv;

process.argv.forEach(function (val, index) {
	parsed = val.split("=");
	if (parsed[0] == "env") {
		argEnv = parsed[1];
	}
});

var env = process.env.NODE_ENV || argEnv || "production";

console.log("Starting Maid IRC.\nEnvironment: " + env);

// Check to see if it is a supported environment variable
if (["production", "development", "debug"].indexOf(env.toLowerCase()) < 0) {
	console.warn('Sorry! NODE_ENV: "' + env + '" is not recognized. Try "development" or "production".');
}

// Requirements
var http = require("http"),
	express = require("express"),
	fs = require("fs"),
	// Middleware
	favicon = require("serve-favicon"),
	bodyParser = require("body-parser"),
	methodOverride = require("method-override"),
	lessMiddleware = require("less-middleware"),
	compression = require("compression"),
	// Maid IRC libs
	maidStatic = require("./lib/maidStatic"),
	maidIrc = require("./lib/maidIrc"),
	maidHelpers = require("./lib/maidHelpers"),
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
var server,
	io = require("socket.io");

function httpServer () {
	var server = http.createServer(app).listen(config.http_port, config.http_host);
	maidIrc(io.listen(server));
}

function httpsServer () {
	var server = http.createServer({key: config.private_key, cert: config.certificate}, app).listen(config.https_port, config.http_host);
	maidIrc(io.listen(server));
}

if (config.enable_https >= 1) { // If HTTPS
	if (config.private_key && config.certificate) {
		switch (config.enable_https) {
			case 1: // Both HTTP and HTTPS
				httpServer();
				httpsServer();
				break;
			case 2: // HTTPS only
				httpsServer();
				break;
			default: // Typo? :p
				console.warn("The setting in enable_https in config.js only accepts 0-2. Starting in HTTPS only mode.")
				httpsServer();
				break;
		}
	} else {
		maidHelpers.stopMaid("To use HTTPS, private_key and certificate both need to be set in config.js!");
	}
} else { // If HTTP only
	httpServer();
}

// Now that thats done with lets pass it of to maidStatic.js and maidIrc.js
maidStatic(app);

// Technical
process.on("SIGINT", function() {
	maidHelpers.stopMaid("SIGINT");
});
