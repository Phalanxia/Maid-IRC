'use strict';

const irc = require('irc');
let allClients = [];

function maidIrc(io, env) {
	function createClient(socket, info, clientId) {
		// Create the IRC client instance
		console.log('Creating new IRC client instance.');
		let _debug = false;

		if (env === 'development') {
			_debug = true;
		}

		var client = new irc.Client(info.server, info.nick, {
			userName: info.nick,
			realName: info.realName,
			password: info.nicknamePassword,
			port: info.port,
			localAddress: null,
			debug: _debug,
			showErrors: true,
			autoRejoin: true,
			autoConnect: false,
			channels: [info.channel],
			retryCount: null,
			retryDelay: 2000,
			secure: false,
			selfSigned: false,
			certExpired: false,
			floodProtection: true,
			floodProtectionDelay: 1000,
			sasl: false,
			stripColors: true,
			messageSplit: 512,
			encoding: false,
			webirc: {
				pass: '',
				ip: '',
				user: ''
			}
		});

		if (env === 'development') {
			client.on('registered', function() {
				console.log('001 message recieved.');
			});
		}

		client.on('abort', function() {
			socket.emit('error', {
				type: 'connection'
			});
		});

		client.on('raw', function(message) {
			if (env === 'development') {
				console.log(message);
			}

			socket.emit('raw', [clientId, message]);
		});

		client.on('error', function(message) {
			console.log('Node-IRC Error: ' + JSON.stringify(message));
		});

		return client;
	}

	io.sockets.on('connection', function(socket) {
		console.log('Client connected from: ' + socket.handshake.address);

		let i;
		let thisClient = {};

		socket.on('connectToNetwork', function(data) {
			if (typeof data === undefined) {
				socket.disconnect('unauthorized');
			} else {
				const networkName = data[0].name;
				const options = data[0].options;
				const connectionId = data[1];
				let clientInstance;

				thisClient[connectionId] = createClient(socket, data[0], connectionId);
				clientInstance = thisClient[connectionId];

				clientInstance.connect(); // Connect it now!

				if (!clientInstance.conn._connecting || clientInstance.conn._hadError) {
					// It didn't connect?
				}

				socket.on('disconnect', function(reason) {
					console.log('Client disconnected: ' + reason);
					clientInstance.disconnect('Connection closed');

					delete thisClient[connectionId];
				});

				socket.on('send-raw', function(message) {
					clientInstance.send.apply(null, message);
				});

				i = allClients.push(socket);
			}
		});

		socket.on('disconnectFromNetwork', function(id) {
			// Needs error checking
			thisClient[id].disconnect();
			delete thisClient[id];
		});

		// Find the correct event for a socket disconnection
		socket.on('liveDisconnect', function() {
			Object.keys(thisClient, function(key) {
				thisClient[key].disconnect(); // Or however you do that :P
			});
			allClients.splice(i, 1);
		});
	});
}

module.exports = maidIrc;
