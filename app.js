console.log("Starting");

var ircLib = require('irc'),
	express = require('express'),
	io = require('socket.io'),
	http = require('http'),
	fs = require('fs');

// Get config
var config = require('./configs/config.js');

// Set up express
var app = express();

app.configure(function () {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');

	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

var server = http.createServer(app)
	.listen(config.http_port, config.http_host);

app.get('/', function (req, res) {
	res.render("index", {});
});

app.post('/client', function (req, res) {
	console.log(req.body);
	res.render("client", {title: req.body.cats});
});

// Set up socket.io

var io = require('socket.io').listen(server);
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
	// Emit
	//io.sockets.emit('ircserver', connectedIRCserver);

	// Recieved
	socket.on('shutdown', function (data) {
		setTimeout(function () {
			console.log('Exiting.');
			process.exit(0);
		}, 100);
	});

	socket.on('server', function (data) {
		console.log(data);
	});
});

function log (name, content) {
	fs.appendFile(config.logging_directory + name + '.log', content + '\r\n', function (err) {
		if (err) throw err;
	});
}