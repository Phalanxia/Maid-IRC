class Outgoing {
	commands(command, args) {
		const _args = args;

		const commandTable = {
			me: () => {
				const message = {
					type: 'privmsg',
					icon: ['fa-angle-double-right', 'Action'],
					channel: Maid.focusedSource,
					message: `${Maid.sessions[Maid.focusedServer].nick} ${_args}`,
				};

				// Display the message
				const NewMessage = new Message(message, Maid.focusedServer);
				NewMessage.filter();
				NewMessage.display();

				// Send message data to the server
				connections.send('send-raw', ['PRIVMSG', Maid.focusedSource, `\x01ACTION ${_args}\x01`]);
			},

			version: () => {
				// Verify that the user specified a target
				if (!_args.split(' ')[0]) {
					return;
				}

				const message = {
					type: 'privmsg',
					icon: ['fa-angle-double-right', 'VERSION'],
					head: `To ${_args.split(' ')[0]}`,
					channel: Maid.focusedSource,
					message: 'CTCP VERSION',
				};

				// Display the message
				const NewMessage = new Message(message, Maid.focusedServer);
				NewMessage.filter();
				NewMessage.display();

				// Send message data to the server
				connections.send('send-raw', ['PRIVMSG', _args.split(' ')[0], '\x01VERSION\x01']);
			},

			time: () => {
				// Verify that the user specified a target
				if (!_args.split(' ')[0]) {
					return;
				}

				const message = {
					type: 'privmsg',
					icon: ['fa-angle-double-right', 'TIME'],
					head: `To ${_args.split(' ')[0]}`,
					channel: Maid.focusedSource,
					message: 'CTCP TIME',
				};

				// Display the message
				const NewMessage = new Message(message, Maid.focusedServer);
				NewMessage.filter();
				NewMessage.display();

				// Send message data to the server
				connections.send('send-raw', ['PRIVMSG', _args.split(' ')[0], '\x01TIME\x01']);
			},

			join: () => {
				connections.send('send-raw', ['JOIN', _args]);
			},
		};

		// Invoke command
		(commandTable[command])();
	}

	command(data) {
		if (data === '') {
			return;
		}

		// List of supported commands
		const commands = [
			// CTCP
			'me', 'version', 'time',
			// Core
			'join', 'part', 'whois', 'notice', 'away', 'topic',
		];
		const message = data.substring(data.split(' ')[0].length + 1, data.length);
		const command = data.split(' ')[0].toLowerCase();

		// If it's a supported command
		if (commands.indexOf(command) > -1) {
			// Depending on the command, lets do something
			this.commands(command, message);
		} else {
			// It's not one of our commands
			connections.send('send-raw', message);
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
			connections.send('send-raw', ['PRIVMSG', Maid.focusedSource, _data]);

			// Display the message
			const updateMessage = {
				type: 'privmsg',
				head: Maid.sessions[Maid.focusedServer].nick,
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
