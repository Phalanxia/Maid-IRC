/*
 ,ggg, ,ggg,_,ggg,                                       ,a8a,  ,ggggggggggg,        ,gggg,
dP""Y8dP""Y88P""Y8b                            8I       ,8" "8,dP"""88""""""Y8,    ,88"""Y8b,
Yb, `88'  `88'  `88                            8I       d8   8bYb,  88      `8b   d8"     `Y8
 `"  88    88    88               gg           8I       88   88 `"  88      ,8P  d8'   8b  d8
     88    88    88               ""           8I       88   88     88aaaad8P"  ,8I    "Y88P'
     88    88    88    ,gggg,gg   gg     ,gggg,8I       Y8   8P     88""""Yb,   I8'
     88    88    88   dP"  "Y8I   88    dP"  "Y8I       `8, ,8'     88     "8b  d8
     88    88    88  i8'    ,8I   88   i8'    ,8I  8888  "8,8"      88      `8i Y8,
     88    88    Y8,,d8,   ,d8b,_,88,_,d8,   ,d8b, `8b,  ,d8b,      88       Yb,`Yba,,_____,
     88    88    `Y8P"Y8888P"`Y88P""Y8P"Y8888P"`Y8   "Y88P" "Y8     88        Y8  `"Y8888888
*/

console.log("Starting Maid IRC.\nEnviroment: " + process.env.NODE_ENV);

if (process.env.NODE_ENV === undefined) {
	console.warn("Please define the NODE_ENV.");
} else if (process.env.NODE_ENV != "production" && process.env.NODE_ENV != "development") {
	console.warn('Sorry! NODE_ENV: "' + process.env.NODE_ENV + '" is not recognized. Try "development" or "production".');
}

var ircLib = require('irc'),
	express = require('express'),
	io = require('socket.io'),
	http = require('http'),
	fs = require('fs'),
	lessMiddleware = require('less-middleware');

var devMode = false;

// Get config
var config = require('./config.js');

// Set up express
var app = express();

app.configure('development', function() {
	app.use(express.errorHandler());
	app.use(express.logger('dev'));
	devMode = true;
});

app.configure('production', function() {
	var minify = require('express-minify');
	app.use(minify());
});

app.configure(function () {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');

	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(app.router);

	// Set up less.css middleware
	app.use(lessMiddleware(__dirname + '/public', {
		compress: true,
		optimization: 2
	}));

	app.use(express.static(__dirname + '/public'));
	app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
});

var server = http.createServer(app)
	.listen(config.http_port, config.http_host);

app.get('/', function (req, res) {
	res.render('index', {});
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

function getMask (message) {
	return message.nick + '!' + message.user + '@' + message.host;
}

// Client
app.post('/client', function (req, res) {
	// I feel like this might be a messy way of doing it but it will be fine for now.

	// Update: It doesn't work at all.

	res.render("client", {
		server: req.body.server,
		name: req.body.name,
	});

	if (devMode) {
		console.log(JSON.stringify(req.body));
	}

	if (!req.body.realName) req.body.realName = "MaidIRC";
	if (!req.body.port)	req.body.port = 6667;

	if (!req.body.sslToggle || req.body.sslToggle == "undefined") {
		req.body.sslToggle = false;
	} else if (req.body.sslToggle == "on") {
		req.body.sslToggle = true;
	} else {
		req.body.sslToggle = false;
	}

	var irc = new ircLib.Client(req.body.server, req.body.name, {
		channels: [req.body.channel],
		userName: req.body.name,
		password: req.body.nicknamePassword,
		realName: req.body.realName,
		port: req.body.port,
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
	};

	io.sockets.on('connection', function (socket) {
		console.log("Client connected from: " + socket.handshake.address.address + ":" + socket.handshake.address.port);
		socket.emit('initialInfo', req.body.name);

		// IRC Listeners

		// Get the network name.
		irc.addListener('raw', function (data) {
			if (data.rawCommand == '005') {
				for (var i = data.args.length - 1; i >= 0; i--) {
					if (data.args[i].indexOf("NETWORK") != -1) {
						var networkName = data.args[i].split("NETWORK=")[1];
						socket.emit('networkName', networkName);
					}
				}
			}
		});

		irc.addListener('registered', function (message) {
			if (devMode) {
				console.log('Server: ' + message.server);
				console.log(message.args[1]);
			}

			socket.emit('recieveMessage', {
				type: "serverMessage",
				message: message.args[1]
			});
		});

		irc.addListener('motd', function (motd) {
			socket.emit('recieveMessage', {
				type: "serverMessage",
				message: motd
			});
		});

		irc.addListener('names', function (channel, nicks) {
			socket.emit('updateInfo', {
				type: "channel",
				action: "join",
				channel: channel,
				channelInfo: irc.chans[channel]
			});

			socket.emit('updateInfo', {
				type: "users",
				channel: channel,
				users: irc.chans[channel].users
			});

			socket.emit('updateInfo', {
				type: "topic",
				channel: channel,
				topic: irc.chans[channel].topic
			});

		});

		irc.addListener('message', function (nick, to, text, message) {
			socket.emit('recieveMessage', {
				type: "message",
				nick: nick,
				channel: to,
				message: text,
				mask: getMask(message)
			});
		});

		irc.addListener('join', function (channel, nick, message) {
			socket.emit('recieveMessage', {
				type: "join",
				nick: nick,
				channel: channel,
				message: message,
				info: message
			});

			socket.emit('updateInfo', {
				type: "users",
				channel: channel,
				users: irc.chans[channel].users
			});
		});

		irc.addListener('part', function (channel, nick, message) {
			socket.emit('recieveMessage', {
				type: "part",
				nick: nick,
				channel: channel,
				message: message,
				info: message
			});

			socket.emit('updateInfo', {
				type: "users",
				channel: channel,
				users: irc.chans[channel].users
			});
		});


		irc.addListener('quit', function (nick, reason, channels, message) {
			socket.emit('recieveMessage', {
				type: "quit",
				nick: nick,
				channels: channels,
				message: reason,
				info: message
			});

			socket.emit('updateInfo', {
				type: "users",
				channel: channel,
				users: irc.chans[channel].users
			});
		});

		irc.addListener('notice', function (nick, to, text, message) {
			socket.emit('recieveMessage', {
				type: "notice",
				nick: nick,
				channel: to,
				message: text,
				mask: getMask(message)
			});
		});

		irc.addListener('nick', function (oldNick, newNick, channels, message) {
			socket.emit('recieveMessage', {
				type: "nickChange",
				oldNick: oldNick,
				newNick: newNick,
				channels: channels,
				message: message
			});

			socket.emit('updateInfo', {
				type: "users",
				channel: channel,
				users: irc.chans[channel].users
			});
		});

		irc.addListener('topic', function (channel, topic, nick, message) {
			if (message.command == 333) {
				socket.emit('recieveMessage', {
					type: 'topic',
					channel: channel,
					topic: topic,
					nick: nick,
					args: message.args
				});
			} else {
				socket.emit('recieveMessage', {
					type: 'topicChange',
					channel: channel,
					topic: topic,
					nick: nick
				});
			}

			socket.emit('updateInfo', {
				type: "topic",
				channel: channel,
				topic: irc.chans[channel].topic
			});
		});

		irc.addListener('error', function (message) {
			console.log('error: ', message);
		});

		// And now the rest of the Socket.io code.

		// Recieved
		socket.on('shutdown', function (data) {
			irc.disconnect("Quit");
			if (devMode) {
				setTimeout(function () {
					console.log('Exiting.');
					process.exit(0);
				}, 100);
			}
		});

		socket.on('disconnect', function () {
			console.log("Client disconnected");
			irc.disconnect("Quit");
		});

		// IRC Recieve
		socket.on('sendServer', function (data) {
			console.log(data);
		});

		socket.on('sendMessage', function (data) {
			irc.say(data[0], data[1]);
		});

		socket.on('sendCommand', function (data) {
			switch(data.type) {
				case "join":
					irc.join(data.content);
					socket.emit('updateInfo', {
						type: "channel",
						action: "join",
						channel: data.content,
						channelInfo: irc.chans[channel]
					});
					break;
				case "part":
					irc.part(data.content);
					socket.emit('updateInfo', {
						type: "channel",
						action: "part",
						channel: data.content,
						channelInfo: irc.chans[channel]
					});
					break;
				case "action":
					irc.action(data.channel, data.message);
					break;
				case "notice":
					irc.action(data.channel, data.message);
					break;
				case "away":
					irc.send('AWAY', data.message);
					break;
				case "topic":
					irc.send('TOPIC', data.channel, data.message);
					break;
			}
		});
	});
});
