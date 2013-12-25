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

// Set up socket.io
var io = require('socket.io').listen(server);
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
	// Emit

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

// Client
app.post('/client', function (req, res) {
	console.log(req.body);
	res.render("client", {server: req.body.server, name: req.body.name, channel: req.body.channel});

	var theChannel = [req.body.channel]
	console.log(theChannel);

	var client = new ircLib.Client(req.body.server, req.body.name, {
		channels: theChannel,
		userName: req.body.name,
		password: null,
		realName: "MadiIRC",
		floodProtection: true,
		floodProtectionDelay: 1000,
		autoRejoin: true,
		autoConnect: true,
		stripColors: true
	});

	// IRC Listeners
	client.addListener('registered', function (message) {
		console.log('Server: ' + message.server);
		console.log(message.args[1]);
	});

	client.addListener('message', function (from, to, message) {
		console.log(to + ' => ' + from + ': ' + message);
		if (message == 'say meow') {
			client.say('##phalanxia', 'nyan~');
		}
	});

	client.addListener('join', function (from, to, message) {
		data = ['join', from, to, message];
		io.sockets.emit('join/part', data);
	});

	client.addListener('part', function (from, to, message) {
		data = ['part', from, to, message];
		io.sockets.emit('join/part', data);
	});

	client.addListener('error', function (message) {
		console.log('error: ', message);
	});

	return client;
});
