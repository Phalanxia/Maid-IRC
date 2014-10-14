var UpdateInterface = (function () {
	"use strict";

	var module = function () {};

	// Update
	module.prototype.messageSources = function (connectionId) {
		console.log(connectionId);
		// Remove all the current items in the list
		[].map.call(selectAll('#network-panel > ul'), function (obj) {
			obj.parentNode.removeChild(obj);
		});

		// Render the template
		select('#network-panel header').insertAdjacentHTML('afterend', Templates.messageSource.compiled({
				serverName: client.networks.name || "Server",
				sources: client.networks[connectionId].sources,
				connectionId: connectionId
			})
		);

		var network = client.networks[connectionId],
			sourceList = selectAll('.message-source-list li');

		// Now lets update the navigation for the directory.
		function navigation (element) {
			var serverId = element.getAttribute("data-server-id").toLowerCase(),
				source = element.getAttribute("data-value").toLowerCase();

			// If you're already viewing it, there's no point in this so lets do nothing
			if (source == client.networks.focusedSource) {
				return;
			}

			client.networks.focusedServer = serverId;
			client.networks.focusedSource = source;

			// Reset focuseed source class
			[].map.call(sourceList, function (obj) {
				obj.classList.remove('focusedSource');
			});

			switch (element.className) {
				case "channel":
					var channel = network.sources[source];

					if (typeof channel.topic !== "undefined") {
						select('#channel-console header input').value = channel.topic;
					} else {
						select('#channel-console header input').value = '';
					}
					break;
				case "pm":
					select('#channel-console header input').value = 'Private Message';
					break;
				case "network":
					select('#channel-console header input').value = "Server";
					// TODO: Get the server name based off the ID
					break;
			}

			// Update Displayed
			select(sourceList + ':nth-of-type(' + parseFloat(element.getAttribute("data-number")) + ')').classList.add('focusedSource');
			// select(sourceList + ':nth-of-type(' + (parseFloat(element.getAttribute("data-number")) + 1) + ')').classList.add('focusedSource');
			select('#users ul').innerHTML = '';

			// Show messages that are from the focused channel.
			[].map.call(selectAll('#channel-console output article[data-source="' + client.networks.focusedSource + '"]'), function (obj) {
				obj.style.display = '';
			});

			// Hide messages that are not from the focused channel.
			[].map.call(selectAll('#channel-console output article:not([data-source="' + client.networks.focusedSource + '"])'), function (obj) {
				obj.style.display = 'none';
			});
		}

		[].map.call(sourceList, function (obj) {
			obj.onclick = navigation(obj);
		});
	};

	// Update topic
	module.prototype.topic = function (topic) {
		select('#channel-console header input').value = topic || '';
	};

	module.prototype.users = function (channel, connectionId) {
		// Clear interface.
		select('#users > ul').innerHTML = '';
		select('#users header p').innerHTML = '';

		// Set up user list.
		var network = client.networks[connectionId];

		console.log(network.sources[channel]);

		var userList = [],
			users = network.sources[channel].users;

		userList = Object.keys(users);

		// Lets sort the user list based on rank and alphabetizing.
		userList.sort(function(a, b) {
			var rankString = "\r~&@%+";
			var rankString = "\r+%@&~";
			var rankA = rankString.indexOf(users[a]),
				rankB = rankString.indexOf(users[b]);

			var rankSort = rankA == rankB ? 0 : (rankA > rankB ? 1 : -1);
			if (rankSort === 0) {
				return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
			}
			return rankSort;
		});

		for (var i = userList.length - 1; i >= 0; i--) {
			var identifyer = {};
			identifyer.rank = users[userList[i]];
			identifyer.icon = "";

			if (users[userList[i]] !== "") {
				switch (users[userList[i]]) {
					case "~": // Owners
						identifyer.icon = "&#xf004";
						break;
					case "&": // Admins
						identifyer.icon = "&#xf0ac";
						break;
					case "@": // Ops
						identifyer.icon = "&#xf0e3";
						break;
					case "%": // Half-ops
						identifyer.icon = "&#xf132";
						break;
					case "+": // Voiced
						identifyer.icon = "&#xf075";
						break;
				}
			}

			select('#users ul').insertAdjacentHTML('beforeend', '<li><p data-rank="' + identifyer.rank + '" data-rank-icon="' + identifyer.icon + '">' + userList[i] + '</p></li>');
		}

		// Get user count
		select('#users header p').innerHTML = userList.length + " users";
	};

	module.prototype.message = function (data, connectionId) {
		// console.log("New Message:" + JSON.stringify(data));
		// Filter the message of html unfriendly characters
		var message = data.message
			.replace(/&/g, "&amp;")
			.replace(/"/g, '&quot;')
			.replace(/'/g, "&apos;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

		// Create get the time for the timestamp
		var output = select('#channel-console output'),
			rawTime = new Date(),
			scrollInfoView;
		// Lets format the timestamp
		var timestamp = ("0" + rawTime.getHours()).slice(-2) + ":" + ("0" + rawTime.getMinutes()).slice(-2) + ":" + ("0" + rawTime.getSeconds()).slice(-2);

		// If it's not a message from the server
		if (data.channel !== "SERVER") {
			// Lets highlight your nick!
			var highlightNick = function (name, input) {
				var exp = new RegExp('\\b(' + name + ')', 'ig');
				return input.replace(exp, '<span class="highlighted">$1</span>');
			};

			var i;
			for (i = 0; i < client.settings.highlights.length; i++) {
				message = highlightNick(client.settings.highlights[i], message);
			}
		}

		// If there is no specified channel just use the one the client is currently focused on
		if (typeof data.channel === 'undefined') {
			data.channel = client.networks[connectionId].focusedSource;
		}

		// If scrolled at the bottom set scrollIntoView as true.
		if (output.scrollHeight - output.scrollTop === output.clientHeight) {
			scrollInfoView = true;
		}

		// Remove the filler message the console
		output.removeChild(select('article.filler'));

		// Insert message into the console
		output.insertAdjacentHTML('beforeend', Templates.message.compiled({
				connectionId: connectionId,
				source: data.channel.toLowerCase(),
				type: data.type,
				timestamp: timestamp,
				head: data.head,
				message: message
			})
		);

		// console.log(client.networks[connectionId]);

		// Hide messages not from the focused channel
		[].map.call(selectAll('#channel-console output article:not([data-source="' + client.networks[connectionId].focusedSource + '"])'), function (obj) {
			obj.style.display = 'none';
		});

		// Scroll to bottom unless the user is scrolled up
		if (scrollInfoView) {
			output.scrollTop = output.scrollHeight;
		}
	};

	return module;
})();

var ConnectToNetwork = (function () {
	"use strict";

	var module = function (socket, updateInterface) {
		this.socket = socket;
		this.updateInterface = updateInterface;
	};

	module.prototype.setup = function (data) {
		var connectionId = uuid.v4();

		client.networks[connectionId] = {};

		var network = client.networks[connectionId];

		if (network.realName == "") {
			network.realName = "MaidIRC";
		}

		network.nick = data.nick;
		network.highlights = data.nick;
		// Set default focused source to server.
		network.focusedSource = "server";
		network.sources = {};

		this.connect(data, connectionId);
	};

	module.prototype.connect = function (data, connectionId) {
		// Send connect info to the back-end.
		this.socket.emit("connectToNetwork", [data, connectionId]);
	};

	return module;
})();

var OutgoingMessages = (function () {
	"use strict";

	var module = function (socket, updateInterface) {
		this.socket = socket;
		this.updateInterface = updateInterface;
	};

	module.prototype.filtering = function (data) {
	};

	module.prototype.command = function (data) {
		// If it's empty then lets just not do this okay
		if (data === '') {
			return;
		}

		// List of supported commands.
		var commands = [
			'me',
			'join',
			'part',
			'whois',
			'notice',
			'away',
			'topic'
		],
		message = data.substring(data.split(" ")[0].length + 1, data.length),
		command = data.split(" ")[0];

		// If it's a supported command.
		if (commands.indexOf(command)) {
			// Depending on the command, lets do someething.
			switch (command) {
				case "":
					break;
			}
		} else {
			// It's not a special command that we need to do amazing things with. Display it and send it to the server raw.
			this.socket.emit("send-raw", message);
		}

	};

	module.prototype.send = function (data) {
		if (data.substring(0, 1) == "/" && data.substring(0, 2) != "//") { // Check if it's a command.
			// Remove the / from thee message, it's not needed any more!
			data = data.substring(1, data.length);
			// Send it to the command handler.
			this.command(data);
		} else {
			// Normal Message
		}
	};

	return module;
})();

var IncomingMessages = (function () {
	"use strict";

	var module = function (socket, updateInterface) {
		this.socket = socket;
		this.updateInterface = updateInterface;
	};

	module.prototype.normal = function (connectionId, data) {
		var updateMessage = {},
			network = client.networks[connectionId];

		switch (data.command.toLowerCase()) {
			// Commands
			case "ping":
				break;
			case "privmsg":
				updateMessage = {
					type: "privmsg",
					head: data.nick,
					nick: data.nick,
					channel: data.args[0],
					message: data.args[1]
				};
				break;
			case "notice":
				updateMessage = {
					type: "notice",
					head: data.nick,
					nick: data.nick,
					channel: data.args[0],
					message: data.args[1]
				};
				break;
			case "mode":
				break;
			case "join":
				// Make sure the joined channel is in the current saved channel object
				if (network.sources[data.args[0]] === undefined) {
					network.sources[data.args[0]] = {};
				}

				// If it's us update the network-bar
				if (data.nick == network.nick) {
					console.log("Updating Source List");
					this.updateInterface.messageSources(connectionId);
				}

				// If its the focused channel update the userlist
				if (network.sources[data.args[0]].users !== undefined) {
					if (data.args[0] == network.focusedSource || network.focusedSource == "") {
						this.updateInterface.users(data.args[0], connectionId);
					}
				}

				// Add the join message to the console
				updateMessage = {
					type: "join",
					head: data.nick,
					nick: data.nick,
					channel: data.args[0],
					message: data.nick + " (" + data.prefix + ") has joined " + data.args[0]
				};
				break;
			case "part":
				break;
			case "quit":
				break;
			case "nick":
				break;
			default:
				break;
		}

		if (Object.keys(updateMessage).length !== 0) {
			this.updateInterface.message(updateMessage, connectionId);
		}
	};

	module.prototype.reply = function (connectionId, data) {
		var updateMessage = {},
			network = client.networks[connectionId];

		switch (data.rawCommand) {
			case "001":
				client.networks.nick = data.args[0];
				updateMessage = {
					type: "rpl_welcome",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: data.args[1]
				};
				break;
			case "002":
				updateMessage = {
					type: "rpl_yourhost",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: data.args[1]
				};
				break;
			case "003":
				updateMessage = {
					type: "rpl_created",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: data.args[1]
				};
				break;
			case "004":
				var messages,
					k;

				for (k in data.args) {
					messages = k + " "; // I think this should work?
				}

				updateMessage = {
					type: "rp_myinfo",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: messages
				};
				break;
			case "005":
				var networkName = data.args[9].split("NETWORK=");

				if (networkName.length > 1) {
					if (typeof networkName !== undefined) {
						// select('#network-panel ul h2').innerHTML = networkName[1];
						client.networks.name = networkName[1];
					} else {
						// select('#network-panel ul h2').innerHTML = data.server;
						client.networks.name = data.server;
					}
				}
				break;
			case "251":
				updateMessage = {
					type: "rpl_luserclient",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: data.args[1]
				};
				break;
			case "332":
				// If we dont have the channel stored, lets do that now!
				if (network.sources[data.args[1]] === undefined) {
					network.sources[data.args[1]] = {};
				}
				// Save the topic
				network.sources[data.args[1]].topic = data.args[2];

				if (network.focusedSource === data.args[1]) {
					select('#channel-console header input').value = data.args[2];
				}
				break;
			case "333":
				var topicDate = new Date(data.args[3]*1000);
				updateMessage = {
					type: "rpl_topicwhotime",
					head: ">",
					nick: "SERVER",
					channel: data.args[1],
					message: 'Topic for ' + data.args[1] + ' set by ' + data.args[2] + ' at ' + topicDate
				};
				break;
			case "353":
				// Build the user list and set the joined channels
				var _channel = data.args[2],
					_names = data.args[3].split(" "),
					_re = new RegExp("^([+~&@%]*)(.+)$"),
					_values;

				if (network.sources[_channel] === undefined) {
					network.sources[_channel] = {};
				}

				network.sources[_channel].users = {};

				for (var i = _names.length - 1; i >= 0; i--) {
					if (_names[i] !== "") {
						_values = _re.exec(_names[i]);
						network.sources[_channel].users[_values[2]] = _values[1];
					}
				}

				if (network.sources[_channel] == network.focusedSource) {
					this.updateInterface.users(_channel, connectionId);
				}
				break;
			case "366":
				break;
			case "372":
				updateMessage = {
					type: "rpl_motd",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: data.args[1]
				};
				break;
			case "376":
				updateMessage = {
					type: "rpl_endofmotd",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: data.args[1]
				};
				break;
			case "443":
				updateMessage = {
					type: "err_nicknameinuse",
					head: ">",
					nick: "SERVER",
					channel: "SERVER",
					message: data.args[1] + ": " + data.args[2]
				};
				break;
		}

		if (Object.keys(updateMessage).length !== 0) {
			this.updateInterface.message(updateMessage, connectionId);
		}
	};

	return module;
})();
