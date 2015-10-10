'use strict';

const select = document.querySelector.bind(document);
const selectAll = selection => Array.prototype.slice.call(document.querySelectorAll(selection));

var client = {
	settings: {
		awayMessage: 'Away',
		ignoreList: [],
		highlights: []
	},

	status: {
		connection: false,
		pastDisconnect: false,
		away: false
	},

	networks: {
		focusedServer: ''
	},

	getFocused() {
		return this.networks[this.networks.focusedServer];
	},

	init(connectInfo) {
		var socket = io.connect(window.location.origin, {
			reconnection: true,
			timeout: 20000
		});

		// Modules
		const updateInterface = new UpdateInterface();
		const outgoingMessages = new OutgoingMessages(socket, updateInterface);
		const incomingMessages = new IncomingMessages(socket, updateInterface);
		const connectToNetwork = new ConnectToNetwork(socket, updateInterface);

		connectToNetwork.setup(connectInfo);

		// Respond to pings
		socket.on('ping', (data) => {
			socket.emit('pong', {beat: 1});
		});

		// Lets handle all the socket.io stuff here for now. :3
		socket.on('connect', () => {
			client.status.connection = true;
			console.log('Connected.');
		});

		socket.on('disconnect', () => {
			client.status.connection = false;
			client.status.pastDisconnect = true;
			console.warn('Connection lost.');
		});

		// IRC
		socket.on('raw', (data) => {
			let connectionId = data[0];
			let message = data[1];

			// Handle different command types differently (normal, reply, error)
			if (message.commandType === 'normal') {
				incomingMessages.normal(connectionId, message);
			} else if (message.commandType === 'reply') {
				incomingMessages.reply(connectionId, message);
			} else if (message.commandType === 'error') {
				incomingMessages.error(connectionId, message);
			} else {
				console.warn('Error: Unknown command type ' + '"' + message.commandType + '"');
			}
		});

		function enterMessage() {
			var input = select('#channel-console footer input');
			outgoingMessages.send(input.value);
			input.value = '';
		}

		select('#channel-console footer input').onkeydown = function() {
			if (event.which == 13) { // Enter Key
				enterMessage();
			}
		};

		select('#channel-console footer button').onclick = function() {
			enterMessage();
		};
	}
};

// Handle Login Info
select('#submit').onclick = function(event) {
	event.preventDefault();

	var connectInfo = {};
	var invalid = false;

	selectAll('#connect input').forEach(obj => {
		connectInfo[obj.name] = obj.value;

		// If the input is no longer invalid remove the invalid class.
		if (obj.classList.contains && obj.validity.valid) {
			obj.classList.remove('invalid');
		}

		// If the input is invalid add the invalid class to the input.
		if (!obj.validity.valid) {
			obj.classList.add('invalid');
			invalid = true;
		}
	});

	if (!invalid) {
		if (!connectInfo.realName.length) {
			connectInfo.realName = connectInfo.nick;
		}

		client.init(connectInfo);
		hideModals();
		select('#connect form').reset();
	} else {
		select('#connect').classList.add('invalid');

		setTimeout(function() {
			select('#connect').classList.remove('invalid');
		}, 500);
	}
};
