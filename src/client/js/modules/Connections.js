class Connections {
	constructor() {
		// Technical
		this.connected = false;
		this.pastDisconnect = false;
	}

	startSocketIo() {
		this.socket = io.connect(window.location.origin, {
			reconnection: true,
			timeout: 20000,
		});

		this.socket.on('ping', () => this.socket.emit('pong', { beat: 1 }));

		this.socket.on('connect', () => {
			this.connected = true;
		});

		this.socket.on('disconnect', () => {
			this.connected = false;
			this.pastDisconnect = true;
		});

		// Handle recieved IRC messages
		this.socket.on('raw', data => {
			const connectionId = data[0];
			const message = data[1];

			if (['normal', 'reply', 'error'].indexOf(message.commandType) > -1) {
				incoming.handler(connectionId, message);
			} else {
				console.warn(`Error: Unknown message type "${message.commandType}"`);
			}
		});
	}

	newConnection(information) {
		// Only start a socket.io connection if the user connects to a network
		if (!this.socket) {
			this.startSocketIo();
		}

		const connectionId = uuid.v4();

		// Add a blank object to the sessions with the key of the connection ID
		Maid.sessions[connectionId] = {};

		const connection = Maid.sessions[connectionId];

		if (!connection.realName) {
			connection.realName = 'MaidIRC';
		}

		connection.serverGiven = information.server;
		connection.nick = information.nick;
		connection.sources = {};

		// Add nick to the highlights list
		Maid.sessions.highlights.push(information.nick);

		// Send connect info to the back-end
		this.socket.emit('connectToNetwork', [information, connectionId]);

		// Display the server in the sources list
		sources.addServer(connectionId);

		// If no server is focused, focus on this one
		if (!Maid.focusedServer) {
			Maid.focusedServer = connectionId;
		}
	}

	send(name, data) {
		this.socket.emit(name, data);
	}

	get status() {
		return this.connected;
	}
}
