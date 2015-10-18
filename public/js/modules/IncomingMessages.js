'use strict';

class IncomingMessages {
	constructor(socket, updateInterface) {
		this.socket = socket;
		this.updateInterface = updateInterface;
	}

	normal(connectionId, data) {
		var updateMessage = {};
		var network = client.networks[connectionId];

		switch (data.command.toLowerCase()) {
			case 'ping':
				break;
			case 'privmsg':
				updateMessage = {
					type: 'privmsg',
					channel: data.args[0],
					head: data.nick,
					nick: data.nick,
					message: data.args[1],
					highlightable: true
				};
				break;
			case 'notice':
				updateMessage = {
					type: 'notice',
					channel: data.args[0],
					head: '-notice-',
					nick: data.nick,
					message: data.args[1],
					highlightable: true
				};
				break;
			case 'mode':
				break;
			case 'join':
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
				updateMessage = {
					type: 'join',
					channel: data.args[0],
					head: ['icon', 'fa-sign-in'],
					nick: data.nick,
					message: data.nick + ' (' + data.prefix + ') has Joined (' + data.args[0] + ')'
				};
				break;
			case 'part':
				break;
			case 'quit':
				for (let channel in network.sources) {
					if (data.nick === network.nick) {
						updateMessage = {
							type: 'quit',
							channel: channel,
							head: ['icon', 'fa-angle-double-left'],
							nick: network.nick,
							message: data.nick + ' (' + data.prefix + ') has Quit (' + data.args[0] + ')'
						};
					} else if (data.nick in channel.users) {
						updateMessage = {
							type: 'quit',
							channel: channel,
							head: ['icon', 'fa-angle-double-left'],
							nick: data.nick,
							message: data.nick + ' (' + data.prefix + ') has Quit (' + data.args[0] + ')'
						};
					}
				}
				break;
			case 'nick':
				break;
			case 'error':
				for (let channel in network.sources) {
					updateMessage = {
						type: 'error',
						channel: channel,
						head: ['icon', 'fa-exclamation-circle'],
						nick: 'SERVER',
						message: 'Error: ' + data.args[0]
					};
				}

				// Also send it to the SERVER "channel"
				updateMessage = {
					type: 'error',
					channel: 'SERVER',
					head: ['icon', 'fa-exclamation-circle'],
					nick: 'SERVER',
					message: 'Error: ' + data.args[0]
				};
				break;
			default:
				break;
		}

		if (Object.keys(updateMessage).length !== 0) {
			updateMessage.connectionId = connectionId;
			this.updateInterface.message(updateMessage, connectionId);
		}
	}

	reply(connectionId, data) {
		var updateMessage = {};
		var network = client.networks[connectionId];

		switch (data.rawCommand) {
			case '001':
				network.nick = data.args[0];
				updateMessage = {
					type: 'rpl_welcome',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				};
				break;
			case '002':
				updateMessage = {
					type: 'rpl_yourhost',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				};
				break;
			case '003':
				updateMessage = {
					type: 'rpl_created',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				};
				break;
			case '004':
				var messages;
				var k;

				for (k in data.args) {
					if (typeof data.args[k] !== undefined) {
						messages = messages + data.args[k] + ' '; // I think this should work?
					}
				}

				updateMessage = {
					type: 'rpl_myinfo',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: messages
				};
				break;
			case '005':
				/*
				The number isnt the same for every network. Redo this.
				if (typeof data.args[9] === undefined) {
					return;
				}

				var networkName = data.args[9].split('NETWORK=');

				if (networkName.length > 1) {
					if (typeof networkName !== undefined) {
						// select('#network-panel ul h2').innerHTML = networkName[1];
						network.name = networkName[1];
					} else {
						// select('#network-panel ul h2').innerHTML = data.server;
						network.name = data.server;
					}
				}*/
				break;
			case '251':
				updateMessage = {
					type: 'rpl_luserclient',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				};
				break;
			case '332':
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

				break;
			case '333':
				const topicDate = new Date(data.args[3] * 1000);
				updateMessage = {
					type: 'rpl_topicwhotime',
					channel: data.args[1],
					head: '>',
					nick: 'SERVER',
					message: 'Topic for ' + data.args[1] + ' set by ' + data.args[2] + ' at ' + topicDate
				};
				break;
			case '353':
				// Build the user list and set the joined channels
				const _re = new RegExp('^([+~&@%]*)(.+)$');
				var _channel = data.args[2];
				var _names = data.args[3].split(' ');
				let _values;

				if (network.sources[_channel] === undefined) {
					network.sources[_channel] = {};
				}

				network.sources[_channel].users = {};

				for (var i = _names.length - 1; i >= 0; i--) {
					if (_names[i] !== '') {
						_values = _re.exec(_names[i]);
						network.sources[_channel].users[_values[2]] = _values[1];
					}
				}

				if (network.sources[_channel] === network.focusedSource) {
					this.updateInterface.users(_channel, connectionId);
				}

				break;
			case '366':
				break;
			case '372':
				updateMessage = {
					type: 'rpl_motd',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				};
				break;
			case '376':
				updateMessage = {
					type: 'rpl_endofmotd',
					channel: 'SERVER',
					head: '>',
					nick: 'SERVER',
					message: data.args[1]
				};
				break;
			case '412':
				// err_notexttosend
				updateMessage = {
					type: 'warning',
					channel: 'SERVER',
					head: ['icon', 'fa-exclamation-triangle'],
					nick: 'SERVER',
					message: data.args[1] + ': ' + data.args[2]
				};
				break;
			case '443':
				// err_nicknameinuse
				updateMessage = {
					type: 'warning',
					channel: 'SERVER',
					head: ['icon', 'fa-exclamation-triangle'],
					nick: 'SERVER',
					message: data.args[1] + ': ' + data.args[2]
				};
				break;
		}

		if (Object.keys(updateMessage).length !== 0) {
			updateMessage.connectionId = connectionId;
			this.updateInterface.message(updateMessage, connectionId);
		}
	};

	error(connectionId, data) {
		var updateMessage = {};
		var network = client.networks[connectionId];

		switch (data.rawCommand) {
			case '001':
				break;
		}

		if (Object.keys(updateMessage).length !== 0) {
			updateMessage.connectionId = connectionId;
			this.updateInterface.message(updateMessage, connectionId);
		}
	};
}
