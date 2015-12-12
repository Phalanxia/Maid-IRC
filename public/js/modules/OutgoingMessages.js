'use strict';

class OutgoingMessages {
	constructor(socket, updateInterface) {
		this.socket = socket;
		this.updateInterface = updateInterface;
	}

	filtering(data) {};

	command(data) {
		if (data === '') {
			return;
		}

		// List of supported commands
		const commands = ['me', 'join', 'part', 'whois', 'notice', 'away', 'topic'];
		let message = data.substring(data.split(' ')[0].length + 1, data.length);
		let command = data.split(' ')[0];

		// If it's a supported command
		if (commands.indexOf(command)) {
			// Depending on the command, lets do someething
			switch (command) {
				case '':
					break;
			}
		} else {
			// It's not one of our commands
			this.socket.emit('send-raw', message);
		}
	};

	send(data) {
		if (data === '') {
			return;
		}

		if (data.substring(0, 1) == '/' && data.substring(0, 2) != '//') { // Check if it's a command
			// Remove / from the message, it's not needed any more!
			data = data.substring(1, data.length);

			// Pass it to the command handler
			this.command(data);
		} else {
			// Normal message
			this.socket.emit('send-raw', ['PRIVMSG', client.getFocused().focusedSource, data]);

			// Display it
			let updateMessage = {
				type: 'privmsg',
				head: client.getFocused().nick,
				nick: client.getFocused().nick,
				channel: client.getFocused().focusedSource,
				message: data,
			};

			this.updateInterface.message(updateMessage, client.networks.focusedServer);
		}
	};
}
