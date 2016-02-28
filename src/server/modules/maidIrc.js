'use strict';

const irc = require('irc');
const allClients = [];

function maidIrc(io, env) {
	function createClient(socket, info, clientId) {
		// Create the IRC client instance
		console.log('Creating new IRC client instance');
		let _debug = false;

		if (env === 'development') {
			_debug = true;
		}

		const client = new irc.Client(info.server, info.nick, {
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
				user: '',
			},
		});

		if (env === 'development') {
			client.on('registered', function registered() {
				console.log('001 message recieved');
			});
		}

		client.on('abort', function abort() {
			socket.emit('error', {
				type: 'connection',
			});
		});

		client.on('raw', function raw(message) {
			if (env === 'development') {
				console.log(message);
			}

			socket.emit('raw', [clientId, message]);
		});

		client.on('error', function error(message) {
			console.log(`Node-IRC Error: ${JSON.stringify(message)}`);
		});

		return client;
	}

	io.sockets.on('connection', function connection(socket) {
		console.log(`Client connected from: ${socket.handshake.address}`);

		const thisClient = {};
		let i;

		socket.on('connectToNetwork', function connectToNetwork(data) {
			if (typeof data === undefined) {
				socket.disconnect('unauthorized');
			} else {
				const connectionId = data[1];

				thisClient[connectionId] = createClient(socket, data[0], connectionId);
				const clientInstance = thisClient[connectionId];

				// Connect it now!
				clientInstance.connect();

				if (!clientInstance.conn._connecting || clientInstance.conn._hadError) {
					// It didn't connect?
				}

				socket.on('disconnect', function disconnect(reason) {
					console.log(`Client disconnected: ${reason}`);
					clientInstance.disconnect('Connection closed');

					delete thisClient[connectionId];
				});

				socket.on('send-raw', function sendraw(message) {
					clientInstance.send.apply(null, message);
				});

				i = allClients.push(socket);
			}
		});

		socket.on('disconnectFromNetwork', function disconnect(id) {
			// Needs error checking
			thisClient[id].disconnect();
			delete thisClient[id];
		});

		// Find the correct event for a socket disconnection
		socket.on('liveDisconnect', function liveDisconnect() {
			Object.keys(thisClient, function thisClientKey(key) {
				thisClient[key].disconnect();
			});
			allClients.splice(i, 1);
		});
	});
}

module.exports = maidIrc;
