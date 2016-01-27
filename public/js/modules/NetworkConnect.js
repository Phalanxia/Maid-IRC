'use strict';

class NetworkConnect {
	constructor(socket, sources) {
		this.socket = socket;
		this.sources = sources;
	}

	setup(data) {
		const connectionId = uuid.v4();
		client.networks[connectionId] = {};

		let network = client.networks[connectionId];

		if (!network.realName) {
			network.realName = 'MaidIRC';
		}

		network.nick = data.nick;
		network.highlights = data.nick;

		// Set default focused source to server
		network.focusedSource = 'SERVER';
		network.sources = {};

		this.connect(data, connectionId);

		// Display the server in the sources list
		this.sources.addServer(connectionId);
	};

	connect(data, connectionId) {
		// Send connect info to the back-end
		this.socket.emit('connectToNetwork', [data, connectionId]);
	};
}
