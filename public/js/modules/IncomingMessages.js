'use strict';

class IncomingMessages {
	constructor(updateInterface) {
		this.updateInterface = updateInterface;
		this.connectionId;
	}

	addMessage(content) {
		let _content = content;

		_content.connectionId = this.connectionId;
		this.updateInterface.message(_content, this.connectionId);
	}

	handler(connectionId, data) {
		var network = client.networks[connectionId];
		this.connectionId = connectionId;

		const messageTable = {
			'default': () => {
				console.log(data);
			},

			/*
				Normal messages
			*/

			'ping': () => {
			},

			'privmsg': () => {
				this.addMessage({
					type: 'privmsg',
					channel: data.args[0],
					head: data.nick,
					nick: data.nick,
					message: data.args[1],
					highlightable: true
				});
			},

			'notice': () => {
				this.addMessage({
					type: 'notice',
					channel: data.args[0],
					head: '-notice-',
					nick: data.nick,
					message: data.args[1],
					highlightable: true
				});
			},

			'join': () => {
				// Make sure the joined channel is in the current saved channel object
				if (network.sources[data.args[0]] === undefined) {
					network.sources[data.args[0]] = {};
				}

				// If it's us update the network-bar
				if (data.nick == network.nick) {
					console.log('Updating Source List');
					this.updateInterface.messageSources(connectionId);
				}

				// If its the focused channel update the userlist
				if (network.sources[data.args[0]].users !== undefined) {
					if (data.args[0] === network.focusedSource || network.focusedSource === '') {
						this.updateInterface.users(data.args[0], connectionId);
					}
				}

				// Display join message
				this.addMessage({
					type: 'join',
					channel: data.args[0],
					head: ['icon', 'fa-sign-in'],
					nick: data.nick,
					message: data.nick + ' (' + data.prefix + ') has Joined (' + data.args[0] + ')'
				});
			},

			'quit': () => {
				for (let channel in network.sources) {
					if (data.nick === network.nick) {
						this.addMessage({
							type: 'quit',
							channel: channel,
							head: ['icon', 'fa-angle-double-left'],
							nick: network.nick,
							message: data.nick + ' (' + data.prefix + ') has Quit (' + data.args[0] + ')'
						});
					} else if (data.nick in channel.users) {
						this.addMessage({
							type: 'quit',
							channel: channel,
							head: ['icon', 'fa-angle-double-left'],
							nick: data.nick,
							message: data.nick + ' (' + data.prefix + ') has Quit (' + data.args[0] + ')'
						});
					}
				}
			},

			'error': () => {
				for (let channel in network.sources) {
					this.addMessage({
						type: 'error',
						channel: channel,
						head: ['icon', 'fa-exclamation-circle'],
						nick: 'SERVER',
						message: 'Error: ' + data.args[0]
					});
				}

				// Also send it to the SERVER "channel"
				this.addMessage({
					type: 'error',
					channel: 'SERVER',
					head: ['icon', 'fa-exclamation-circle'],
					nick: 'SERVER',
					message: 'Error: ' + data.args[0]
				});
			},

			/*
				Reply messages
			*/

			'001': () => {
				network.nick = data.args[0];
				this.addMessage({
					type: 'RPL_WELCOME',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				});
			},

			'002': () => {
				this.addMessage({
					type: 'RPL_YOURHOST',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				});
			},

			'003': () => {
				this.addMessage({
					type: 'RPL_CREATED',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				});
			},

			'004': () => {
				var messages;

				for (let k in data.args) {
					if (typeof data.args[k] !== undefined) {
						messages = messages + data.args[k] + ' '; // I think this should work?
					}
				}

				this.addMessage({
					type: 'RPL_MYINFO',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: messages
				});
			},

			'251': () => {
				this.addMessage({
					type: 'RPL_LUSERCLIENT',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				});
			},

			'332': () => {
				// If we dont have the channel stored, lets do that now!
				if (network.sources[data.args[1]] === undefined) {
					network.sources[data.args[1]] = {};
				}

				network.sources[data.args[1]].connectionId = connectionId;

				if (typeof data.args[2] === undefined) {
					data.args[2] = '';
				}

				// Save the topic
				network.sources[data.args[1]].topic = data.args[2];

				if (network.focusedSource === data.args[1]) {
					select('#channel-console header input').value = data.args[2];
				}
			},

			'333': () => {
				const topicDate = new Date(data.args[3] * 1000);

				this.addMessage({
					type: 'RPL_TOPICWHOTIME',
					channel: data.args[1],
					head: '>',
					nick: 'SERVER',
					message: 'Topic for ' + data.args[1] + ' set by ' + data.args[2] + ' at ' + topicDate
				});
			},

			'353': () => {
				// Build the user list and set the joined channels
				const _re = new RegExp('^([+~&@%]*)(.+)$');
				const _channel = data.args[2];
				var _names = data.args[3].split(' ');
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

				if (network.sources[_channel] === network.focusedSource) {
					this.updateInterface.users(_channel, connectionId);
				}
			},

			'372': () => {
				this.addMessage({
					type: 'RPL_MOTD',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				});
			},

			'376': () => {
				this.addMessage({
					type: 'RPL_ENDOFMOTD',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				});
			},

			/*
				Error messages
			*/

			'412': () => {
				this.addMessage({
					type: 'warning',
					channel: 'SERVER',
					head: ['icon', 'fa-exclamation-triangle'],
					nick: 'SERVER',
					message: data.args[1] + ': ' + data.args[2]
				});
			},

			'433': () => {
				this.addMessage({
					type: 'warning',
					channel: 'SERVER',
					head: ['icon', 'fa-exclamation-triangle'],
					nick: 'SERVER',
					message: data.args[1] + ': ' + data.args[2]
				});
			},

			'461': () => {
				this.addMessage({
					type: 'warning',
					channel: 'SERVER',
					head: ['icon', 'fa-exclamation-triangle'],
					nick: 'SERVER',
					message: data.args[1] + ': ' + data.args[2]
				});
			}
		};

		// Invoke command
		(messageTable[data.rawCommand.toLowerCase()] || messageTable['default'])();
	}
}
