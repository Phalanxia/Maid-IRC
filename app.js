console.log("Starting MaidIRC");

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

app.get('/preview', function (req, res) {
	res.render("client", {}); // Go to /preview to preview the client without connecting to IRC.
});

// Set up socket.io
var io = require('socket.io').listen(server);
io.set('log level', 1);

// Logging to file.
function log (name, content) {
	fs.appendFile(config.logging_directory + name + '.log', content + '\r\n', function (err) {
		if (err) throw err;
	});
}

// Client
app.post('/client', function (req, res) {
	// I feel like this might be a messy way of doing it but it will be fine for now.

	res.render("client", {
		server: req.body.server,
		name: req.body.name,
		nicknamePassword: req.body.nicknamePassword,
		channelPassword: req.body.channelPassword,
		channel: req.body.channel
	});

	var client = new ircLib.Client(req.body.server, req.body.name, {
		channels: [req.body.channel],
		userName: req.body.name,
		password: req.body.nicknamePassword,
		realName: "MaidIRC",
		port: 6667,
		floodProtection: true,
		floodProtectionDelay: 1000,
		autoRejoin: true,
		autoConnect: true,
		secure: false,
		selfSigned: false,
		certExpired: false,
		sasl: false,
		stripColors: true,
		messageSplit: 512
	}),
	_settings = {
		nickname: req.body.name,
	}

	io.sockets.on('connection', function (socket) {
		socket.emit('initialInfo', req.body.name);

		// IRC Listeners
		client.addListener('registered', function (message) {
			console.log('Server: ' + message.server);
			console.log(message.args[1]);
		});

		client.addListener('names', function (data) {
			console.log("names: " + data);
			// This happens every time the client joins a channel so I will use this for sending channel data to the client.
			socket.emit('ircInfo', client.chans);
		});

		client.addListener('message', function (from, to, message) {
			console.log(to + ' => ' + from + ': ' + message);
			socket.emit('recieveMessage', [to, from, message]);
		});

		client.addListener('join', function (from, to, message) {
			data = ['join', from, to, message];
			socket.emit('join/part', data);
			// Send channel info to the client.
			socket.emit('ircInfo', client.chans);
		});

		client.addListener('part', function (from, to, message) {
			data = ['part', from, to, message];
			socket.emit('join/part', data);
			// Send channel info to the client.
			socket.emit('ircInfo', client.chans);
		});

		client.addListener('error', function (message) {
			console.log('error: ', message);
		});

		// And now the rest of the Socket.io code.
		
		// Recieved
		socket.on('shutdown', function (data) {
			//client.disconnect("Quit");
			setTimeout(function () {
				console.log('Exiting.');
				process.exit(0);
			}, 100);
		});

		socket.on('disconnect', function () {
			console.log("Client disconnected");
			client.disconnect("Quit");
		});

		// IRC Emit

		// IRC Recieve
		socket.on('sendServer', function (data) {
			console.log(data);
		});

		socket.on('sendMessage', function (data) {
			client.say(data[0], data[1]);
		});

		socket.on('sendCommand', function (data) {
			switch(data.type) {
				case "join":
					client.join(data.content);
					break;
				case "part":
					client.part(data.content);
					break;
				case "me":
					client.action(data.channel, data.content);
					break;
			}
		});
	});
});
