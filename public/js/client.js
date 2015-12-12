'use strict';

const select = document.querySelector.bind(document);
const selectAll = selection => Array.prototype.slice.call(document.querySelectorAll(selection));

var client = {
	settings: {
		awayMessage: 'Away',
		ignoreList: [],
		highlights: [],
	},

	status: {
		connection: false,
		pastDisconnect: false,
		away: false,
	},

	networks: {
		focusedServer: '',
	},

	getFocused() {
		return this.networks[this.networks.focusedServer];
	},

	init(connectInfo) {
		const socket = io.connect(window.location.origin, {
			reconnection: true,
			timeout: 20000,
		});

		// Modules
		const updateInterface = new UpdateInterface();
		const outgoingMessages = new OutgoingMessages(socket, updateInterface);
		const incomingMessages = new IncomingMessages(updateInterface);
		const connectToNetwork = new ConnectToNetwork(socket, updateInterface);

		connectToNetwork.setup(connectInfo);

		socket.on('ping', (data) => {
			socket.emit('pong', {beat: 1});
		});

		socket.on('connect', () => {
			client.status.connection = true;
			console.log('Connected to server back end');
		});

		socket.on('disconnect', () => {
			client.status.connection = false;
			client.status.pastDisconnect = true;
			console.warn('Connection lost');
		});

		// Handle recieved IRC messages
		socket.on('raw', (data) => {
			const connectionId = data[0];
			const message = data[1];

			if (message.commandType === 'normal' || message.commandType === 'reply' || message.commandType === 'error') {
				incomingMessages.handler(connectionId, message);
			} else {
				console.warn('Error: Unknown command type "' + message.commandType + '"');
			}
		});

		function enterMessage() {
			const input = select('#channel-console footer input');
			outgoingMessages.send(input.value);
			input.value = '';
		}

		select('#channel-console footer input').onkeydown = function() {
			if (event.which === 13) { // Enter Key
				enterMessage();
			}
		};

		select('#channel-console footer button').onclick = function() {
			enterMessage();
		};
	}
};

window.onbeforeunload = function() {
	if (client.status.connection) {
		return 'You have attempted to leave this page. Doing so will disconnect you from IRC.';
	}
};

// Handle connection information
select('#submit').onclick = function(event) {
	event.preventDefault();

	let connectInfo = {};
	let invalid = false;

	selectAll('#connect input').forEach(obj => {
		connectInfo[obj.name] = obj.value;

		// If the input is no longer invalid remove the invalid class
		if (obj.classList.contains && obj.validity.valid) {
			obj.classList.remove('invalid');
		}

		// If the input is invalid add the invalid class to the input
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

// Stop form redirect on submit
select('#submit').submit = function(event) {
	event.preventDefault();
	return false;
}

function hideModals() {
	select('#pageCover').classList.remove('displayed');
	selectAll('.modal').forEach(obj => {
		obj.classList.remove('displayed');
	});
}

select('#pageCover').onclick = function() {
	hideModals();
};

selectAll('.modal header button').forEach(obj => {
	obj.onclick = function() {
		hideModals();
	};
});

// Show settings modal
select('#network-panel header button.fa-cog').onclick = function() {
	select('#pageCover').classList.add('displayed');
	select('#settings').classList.add('displayed');
};

// Show connect modal
select('#network-panel header button.fa-sign-in').onclick = function() {
	select('#pageCover').classList.add('displayed');
	select('#connect').classList.add('displayed');
};

// Settings
const settingsItems = select('#settings nav > ul').getElementsByTagName('li');
for (let i = 0; i < settingsItems.length; i++) {
	settingsItems[i].i = i;
	settingsItems[i].onclick = function() {
		let theNumber = this.i;

		selectAll('#settings nav > ul li').forEach(obj => {
			obj.classList.remove('focused');
		});

		select(`#settings nav > ul li:nth-of-type(${theNumber + 1})`).classList.add('focused');

		selectAll('#settings .page').forEach(obj => {
			obj.style.display = 'none';
		});

		selectAll(`#settings .page:nth-of-type(${theNumber + 1})`)[0].style.display = 'block';
	};
}

// Connection screen
let advanced = false;
select('#connect-basic footer button:last-child').onclick = function() {
	if (advanced) {
		select('#connect-advanced').classList.remove('animation-login-advanced');
		select('#connect-advanced').classList.add('animation-login-basic');

		selectAll('input').forEach(obj => {
			obj.tabIndex = '1';
		});
	} else {
		select('#connect-advanced').style.display = 'block';
	}

	advanced = !advanced;
};
