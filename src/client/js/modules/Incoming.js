'use strict';

class Incoming {
	constructor(ui, sources) {
		this.ui = ui;
		this.sources = sources;
	}

	addMessage(content) {
		const _content = content;

		_content.connectionId = this.connectionId;

		const NewMessage = new Message(_content, this.connectionId);
		NewMessage.filter();
		NewMessage.display();

		const output = select('#channel-console output');
		let scrollInfoView;

		// If scrolled at the bottom set scrollIntoView as true
		if (output.scrollHeight - output.scrollTop === output.clientHeight) {
			scrollInfoView = true;
		}

		// Scroll to bottom unless the user is scrolled up
		if (scrollInfoView) {
			output.scrollTop = output.scrollHeight;
		}
	}

	handler(connectionId, data) {
		const _data = data;

		const network = Maid.sessions[connectionId];
		this.connectionId = connectionId;

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
				this.addMessage({
					type: 'privmsg',
					channel: _data.args[0],
					head: _data.nick,
					message: _data.args[1],
					isHighlightable: true,
				});
			},

			notice: () => {
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

					this.sources.addToList(connectionId, _data.args[0]);
				}

				// If its the focused channel update the userlist
				if (network.sources[_data.args[0]].users !== undefined) {
					if (_data.args[0] === Maid.focusedSource || Maid.focusedSource === '') {
						this.ui.users(_data.args[0], connectionId);
					}
				}

				// Display join message
				this.addMessage({
					type: 'join',
					channel: _data.args[0],
					icon: 'fa-sign-in',
					message: _data.nick + ' (' + _data.prefix + ') has Joined (' + _data.args[0] + ')',
				});
			},

			quit: () => {
				for (const channel in network.sources) {
					if (_data.nick === network.nick) {
						this.addMessage({
							channel,
							type: 'quit',
							icon: 'fa-angle-double-left',
							message: _data.nick + ' (' + _data.prefix + ') has Quit (' + _data.args[0] + ')',
						});
					} else if (_data.nick in channel.users) {
						this.addMessage({
							channel,
							type: 'quit',
							icon: 'fa-angle-double-left',
							message: _data.nick + ' (' + _data.prefix + ') has Quit (' + _data.args[0] + ')',
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
							icon: 'fa-exclamation-circle',
							message: 'Error: ' + _data.args[0],
						});
					}
				}

				// Also send it to the SERVER "channel"
				this.addMessage({
					type: 'error',
					channel: 'server',
					icon: 'fa-exclamation-circle',
					message: 'Error: ' + _data.args[0],
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
					head: '>',
					message: 'Topic for ' + _data.args[1] + ' set by ' + _data.args[2] + ' at ' + topicDate,
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
					this.ui.users(_channel, connectionId);
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

			412: () => {
				this.addMessage({
					type: 'warning',
					channel: 'server',
					icon: 'fa-exclamation-triangle',
					message: _data.args[1] + ': ' + _data.args[2],
				});
			},

			433: () => {
				this.addMessage({
					type: 'warning',
					channel: 'server',
					icon: 'fa-exclamation-triangle',
					message: _data.args[1] + ': ' + _data.args[2],
				});
			},

			461: () => {
				this.addMessage({
					type: 'warning',
					channel: 'server',
					icon: 'fa-exclamation-triangle',
					message: _data.args[1] + ': ' + _data.args[2],
				});
			},
		};

		// Invoke command
		(messageTable[_data.rawCommand.toLowerCase()] || messageTable.default)();
	}
}
