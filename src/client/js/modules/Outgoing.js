'use strict';

class Outgoing {
	constructor(connections) {
		this.connections = connections;
	}

	filtering() {}

	command(data) {
		if (data === '') {
			return;
		}

		// List of supported commands
		const commands = ['me', 'join', 'part', 'whois', 'notice', 'away', 'topic'];
		const message = data.substring(data.split(' ')[0].length + 1, data.length);
		const command = data.split(' ')[0];

		// If it's a supported command
		if (commands.indexOf(command) > -1) {
			// Depending on the command, lets do someething
		} else {
			// It's not one of our commands
			this.connections.send('send-raw', message);
		}
	}

	send(data) {
		if (!data) {
			return;
		}

		let _data = data;

		// Check if it's a command
		if (_data.substring(0, 1) === '/' && _data.substring(0, 2) !== '//') {
			// Remove / from the message, it's not needed any more!
			_data = _data.substring(1, _data.length);

			// Pass it to the command handler
			this.command(_data);
		} else {
			// Normal message
			this.connections.send('send-raw', ['PRIVMSG', Maid.focusedSource, _data]);

			// Display the message
			const updateMessage = {
				type: 'privmsg',
				head: Maid.sessions[Maid.focusedServer].nick,
				nick: Maid.sessions[Maid.focusedServer].nick,
				channel: Maid.focusedSource,
				message: _data,
			};

			// Display the message
			const NewMessage = new Message(updateMessage, Maid.focusedServer);
			NewMessage.filter();
			NewMessage.display();
		}
	}
}
