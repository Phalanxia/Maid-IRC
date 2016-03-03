class Incoming {
	addMessage(content) {
		const _content = content;

		_content.connectionId = this.connectionId;

		const NewMessage = new Message(_content, this.connectionId);
		NewMessage.filter();

		const output = select('#channel-console output');

		// Get scroll information before displaying the message
		const scrollBar = output.scrollHeight <= output.clientHeight;

		NewMessage.display();

		// If this message added a scroll bar
		if (!scrollBar && output.scrollHeight > output.clientHeight) {
			output.scrollTop = output.scrollHeight;
		}

		// Scroll to bottom unless the user is scrolled up
		if (output.scrollHeight - output.scrollTop === output.clientHeight) {
			output.scrollTop = output.scrollHeight;
		}
	}

	handler(connectionId, data) {
		const _data = data;

		const network = Maid.sessions[connectionId];
		this.connectionId = connectionId;

		if (Maid.settings.debug) {
			console.log(data);
		}

		const messageTable = {
			default: () => {
				if (Maid.settings.debug) {
					console.log(data);
				}
			},

			/*
				Normal messages
			*/

			ping: () => {},

			privmsg: () => {
				// Check if the message is from the server
				if (_data.prefix === _data.server) {
					_data.args[0] = 'server';
				}

				// Detect if the message is a CTCP
				if (_data.args[1].startsWith('\x01') && _data.args[1].endsWith('\x01')) {
					// If its an ACTION message (/me)
					if (_data.args[1].startsWith('\x01ACTION')) {
						const slicedString = _data.args[1].slice(7, -1);

						this.addMessage({
							type: 'privmsg',
							channel: _data.args[0],
							icon: ['fa-angle-double-right', 'Action'],
							message: `${_data.nick}${slicedString}`,
							isHighlightable: true,
						});
					} else if (_data.args[1].startsWith('\x01VERSION')) {
						// Display the CTCP VERSION request
						this.addMessage({
							type: 'privmsg',
							channel: _data.nick,
							icon: ['fa-angle-double-right', 'Version'],
							message: `Recieved a CTCP VERSION from ${_data.nick}`,
							isHighlightable: true,
						});

						// Respond
						connections.send('send-raw', [
							'NOTICE',
							_data.nick,
							`VERSION Maid-IRC ${Maid.version}`,
						]);
					} else if (_data.args[1].startsWith('\x01TIME')) {
						// Display the CTCP VERSION request
						this.addMessage({
							type: 'privmsg',
							channel: _data.nick,
							icon: ['fa-clock-o', 'Time'],
							message: `Recieved a CTCP TIME from ${_data.nick}`,
							isHighlightable: true,
						});

						// Respond
						connections.send('send-raw', [
							'NOTICE',
							_data.nick,
							`TIME ${new Date}`,
						]);
					}
				} else {
					// Normal message
					this.addMessage({
						type: 'privmsg',
						channel: _data.args[0],
						head: _data.nick,
						message: _data.args[1],
						isHighlightable: true,
					});
				}
			},

			notice: () => {
				// Check if the message is from the server
				if (
					_data.prefix === _data.server
					|| ['chanserv', 'nickserv'].indexOf(_data.nick.toLowerCase()) >= 0
					// TODO: Check what services the network supports
				) {
					_data.args[0] = 'server';
				}

				// Check if it's a PM
				if (_data.args[0] === network.nick) {
					_data.args[0] = _data.nick;
				}

				this.addMessage({
					type: 'notice',
					channel: _data.args[0],
					head: '-notice-',
					message: _data.args[1],
					isHighlightable: true,
				});
			},

			join: () => {
				// Make sure the joined channel is in the current saved channel object
				if (network.sources[_data.args[0]] === undefined) {
					network.sources[_data.args[0]] = {};
				}

				// If it's us update the network-bar
				if (_data.nick === network.nick) {
					if (Maid.settings.debug) {
						console.log('Updating sources list');
					}

					sources.addToList(connectionId, _data.args[0]);
				}

				// If its the focused channel update the userlist
				if (network.sources[_data.args[0]].users !== undefined) {
					if (_data.args[0] === Maid.focusedSource || Maid.focusedSource === '') {
						ui.users(_data.args[0], connectionId);
					}
				}

				// Display join message
				this.addMessage({
					type: 'join',
					channel: _data.args[0],
					icon: ['fa-sign-in', 'Join'],
					message: `${_data.nick} (${_data.prefix}) has Joined (${_data.args[0]})`,
				});
			},

			quit: () => {
				for (const channel in network.sources) {
					if (_data.nick === network.nick) {
						this.addMessage({
							channel,
							type: 'quit',
							icon: ['fa-angle-double-left', 'Warning'],
							message: `${_data.nick} (${_data.prefix}) has Quit (${_data.args[0]})`,
						});
					} else if (_data.nick in channel.users) {
						this.addMessage({
							channel,
							type: 'quit',
							icon: ['fa-angle-double-left', 'Warning'],
							message: `${_data.nick} (${_data.prefix}) has Quit (${_data.args[0]})`,
						});
					}
				}
			},

			error: () => {
				for (const channel in network.sources) {
					if (channel) {
						this.addMessage({
							channel,
							type: 'error',
							icon: ['fa-exclamation-circle', 'Alert'],
							message: `Error: ${_data.args[0]}`,
						});
					}
				}

				// Also send it to the SERVER "channel"
				this.addMessage({
					type: 'error',
					channel: 'server',
					icon: ['fa-exclamation-circle', 'Alert'],
					message: `Error: ${_data.args[0]}`,
				});
			},

			/*
				Reply messages
			*/

			'001': () => {
				network.nick = _data.args[0];
				this.addMessage({
					type: 'RPL_WELCOME',
					channel: 'server',
					head: '>',
					message: _data.args[1],
				});
			},

			'002': () => {
				this.addMessage({
					type: 'RPL_YOURHOST',
					channel: 'server',
					head: '>',
					message: _data.args[1],
				});
			},

			'003': () => {
				this.addMessage({
					type: 'RPL_CREATED',
					channel: 'server',
					head: '>',
					message: _data.args[1],
				});
			},

			'004': () => {
				let message;

				for (const k in _data.args) {
					if (_data.args[k]) {
						message = `${message}${_data.args[k]} `; // I think this should work?
					}
				}

				this.addMessage({
					message,
					type: 'RPL_MYINFO',
					channel: 'server',
					head: '>',
				});
			},

			251: () => {
				this.addMessage({
					type: 'RPL_LUSERCLIENT',
					channel: 'server',
					head: '>',
					message: _data.args[1],
				});
			},

			332: () => {
				// If we dont have the channel stored, lets do that now!
				if (network.sources[_data.args[1]] === undefined) {
					network.sources[_data.args[1]] = {};
				}

				network.sources[_data.args[1]].connectionId = connectionId;

				if (typeof _data.args[2] === undefined) {
					_data.args[2] = '';
				}

				// Save the topic
				network.sources[_data.args[1]].topic = _data.args[2];

				if (Maid.focusedSource === _data.args[1]) {
					select('#channel-console header input').value = _data.args[2];
				}
			},

			333: () => {
				const topicDate = new Date(_data.args[3] * 1000);

				this.addMessage({
					type: 'RPL_TOPICWHOTIME',
					channel: _data.args[1],
					icon: ['fa-commenting', 'Topic'],
					message: `Topic for ${_data.args[1]} set by ${_data.args[2]} at ${topicDate}`,
				});
			},

			353: () => {
				// Build the user list and set the joined channels
				const _re = new RegExp('^([+~&@%]*)(.+)$');
				const _channel = _data.args[2];
				const _names = _data.args[3].split(' ');
				let _values;

				if (network.sources[_channel] === undefined) {
					network.sources[_channel] = {};
				}

				network.sources[_channel].users = {};

				for (let i = _names.length - 1; i >= 0; i--) {
					if (_names[i] !== '') {
						_values = _re.exec(_names[i]);
						network.sources[_channel].users[_values[2]] = _values[1];
					}
				}

				if (network.sources[_channel] === Maid.focusedSource) {
					ui.users(_channel, connectionId);
				}
			},

			372: () => {
				this.addMessage({
					type: 'RPL_MOTD',
					channel: 'server',
					head: '>',
					message: _data.args[1],
				});
			},

			376: () => {
				this.addMessage({
					type: 'RPL_ENDOFMOTD',
					channel: 'server',
					head: '>',
					message: _data.args[1],
				});
			},

			/*
				Error messages
			*/

			404: () => {
				this.addMessage({
					type: 'warning',
					channel: _data.args[1],
					icon: ['fa-exclamation-triangle', 'Warning'],
					message: _data.args[2],
				});
			},

			412: () => {
				this.addMessage({
					type: 'warning',
					channel: 'server',
					icon: ['fa-exclamation-triangle', 'Warning'],
					message: `${_data.args[1]}: ${_data.args[2]}`,
				});
			},

			433: () => {
				this.addMessage({
					type: 'warning',
					channel: 'server',
					icon: ['fa-exclamation-triangle', 'Warning'],
					message: `${_data.args[1]}: ${_data.args[2]}`,
				});
			},

			461: () => {
				this.addMessage({
					type: 'warning',
					channel: Maid.focusedSource,
					icon: ['fa-exclamation-triangle', 'Warning'],
					message: `${_data.args[1]}: ${_data.args[2]}`,
				});
			},
		};

		// Invoke command
		(messageTable[_data.rawCommand.toLowerCase()] || messageTable.default)();
	}
}
