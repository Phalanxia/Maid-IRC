'use strict';

class UpdateInterface {
	constructor() {
		this.autolinker = new Autolinker({
			 stripPrefix: false,
			 twitter: false,
			 phone: false
		});
	}

	messageSources(connectionId) {
		var _this = this;

		// Remove all the current items in the list
		selectAll('#network-panel > ul').forEach(obj => {
			obj.parentNode.removeChild(obj);
		});

		// Render the template
		select('#network-panel header').insertAdjacentHTML('afterend', Templates.messageSource.compiled({
				serverName: client.networks[connectionId].name || 'Server',
				connectionId: connectionId,
				sources: client.networks[connectionId].sources
			})
		);

		function renderAll(connectionId, source, type) {
			var network = client.networks[connectionId];

			// If you're already viewing it, there's no point in this so lets do nothing
			if (source === network.focusedSource) {
				return;
			}

			client.networks.focusedServer = connectionId;
			network.focusedSource = source;

			// Reset focused source class
			selectAll('.message-source-list li').forEach(obj => {
				obj.classList.remove('focusedSource');
			});

			switch (type.toLowerCase()) {
				case 'channel':
					var channel = network.sources[source];

					if (typeof channel !== undefined) {
						_this.topic(channel.topic);
						select('#channel-console header input').disabled = false;
						select('#users').style.display = '';

						// Update user list
						_this.users(source, connectionId);
					}

					break;
				case 'pm':
					select('#channel-console header input').value = 'Private Message';
					select('#channel-console header input').disabled = true;
					select('#users').style.display = 'none';
					break;
				case 'server':
					select('#channel-console header input').value = network.name || 'Server';
					select('#channel-console header input').disabled = true;
					select('#users').style.display = 'none';
					break;
			}

			// Update Displayed.
			select('[data-connection-id="' + connectionId + '"][data-value="' + source + '"]').classList.add('focusedSource');

			// Hide all messages
			selectAll('#channel-console output article').forEach(obj => {
				obj.style.display = 'none';
			});

			// Show messages that are from the focused source
			selectAll('#channel-console output article[data-source="' + client.networks[connectionId].focusedSource + '"]').forEach(obj => {
				obj.style.display = '';
			});
		};

		selectAll('.message-source-list li').forEach(obj => {
			obj.onclick = () => {
				renderAll(obj.getAttribute('data-connection-id'), obj.getAttribute('data-value'), obj.className);
			};
		});
	}

	topic(topic) {
		if (!topic || typeof topic === undefined || topic === 'undefined') {
			topic = '';
		}

		select('#channel-console header input').value = topic;
	}

	users(channel, connectionId) {
		console.log('Interface: New userlist');

		// Clear users bar
		select('#users ul').innerHTML = '';
		select('#users header p').innerHTML = '';

		// Set up user list.
		var network = client.networks[connectionId];
		var userList = [];
		var users = network.sources[channel].users;

		userList = Object.keys(users);

		// Sort the user list based on rank and alphabetization
		userList.sort(function(a, b) {
			const rankString = '\r+%@&~';
			var rankA = rankString.indexOf(users[a]);
			var rankB = rankString.indexOf(users[b]);

			var rankSort = rankA == rankB ? 0 : (rankA > rankB ? 1 : -1);
			if (rankSort === 0) {
				return a.toLowerCase() < b.toLowerCase() ? 1 : -1;
			}

			return rankSort;
		});

		userList.forEach(function(element, index, array) {
			var identifyer = {};
			identifyer.rank = users[element];
			identifyer.icon = '';

			if (users[element] !== '') {
				switch (users[element]) {
					case '~': // Owners
						identifyer.icon = '&#xf004;';
						break;
					case '&': // Admins
						identifyer.icon = '&#xf0ac;';
						break;
					case '@': // Ops
						identifyer.icon = '&#xf0e3;';
						break;
					case '%': // Half-ops
						identifyer.icon = '&#xf132;';
						break;
					case '+': // Voiced
						identifyer.icon = '&#xf075;';
						break;
				}
			}

			// Display the user in the list
			select('#users ul').insertAdjacentHTML('afterbegin', Templates.userList.compiled({
				rank: identifyer.rank,
				icon: identifyer.icon,
				nick: element
			}));
		});

		// Get user count
		select('#users header p').innerHTML = userList.length + ' users';
	}

	message(data, connectionId) {
		const output = select('#channel-console output');

		// Filter the message of html unfriendly characters
		var message = data.message
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		// Create get the time for the timestamp
		const rawTime = new Date();
		const timestamp = ('0' + rawTime.getHours()).slice(-2) + ':' + ('0' + rawTime.getMinutes()).slice(-2) + ':' + ('0' + rawTime.getSeconds()).slice(-2);

		// If it's not a message from the server
		if (data.channel.toLowerCase() !== 'server' && data.highlightable) {
			// Lets highlight your nick!
			function highlightNick(name, input) {
				var exp = new RegExp('\\b(' + name + ')', 'ig');
				return input.replace(exp, '<span class="highlighted">$1</span>');
			}

			var i;
			for (i = 0; i < client.settings.highlights.length; i++) {
				message = highlightNick(client.settings.highlights[i], message);
			}
		}

		message = this.autolinker.link(message);

		// If there is no specified channel just use the one the client is currently focused on
		if (typeof data.channel === 'undefined') {
			data.channel = client.networks[connectionId].focusedSource;
		}

		let scrollInfoView;

		// If scrolled at the bottom set scrollIntoView as true
		if (output.scrollHeight - output.scrollTop === output.clientHeight) {
			scrollInfoView = true;
		}

		// Remove the filler message the console
		output.removeChild(select('article.filler'));

		let _head = '';
		let _icon = '';

		if (typeof data.head === 'object') {
			if (data.head[0] === 'text') {
 				_head = data.head[1];
			} else if (data.head[0] === 'icon') {
				_head = '';
				_icon = `fa ${data.head[1]}`;
			}
		} else {
			_head = data.head;

			if (typeof _head !== 'undefined' && _head.length > 15) {
				_head = _head.substring(0, 13) + '...';
			}
		}

		// Insert message into the console
		output.insertAdjacentHTML('beforeend', Templates.message.compiled({
				connectionId: connectionId,
				source: data.channel,
				type: data.type,
				timestamp: timestamp,
				head: _head,
				message: message,
				icon: _icon
			})
		);

		// Hide messages not from the focused channel
		selectAll('#channel-console output article:not([data-source="' + client.networks[connectionId].focusedSource + '"])').forEach(obj => {
			obj.style.display = 'none';
		});

		// Scroll to bottom unless the user is scrolled up
		if (scrollInfoView) {
			output.scrollTop = output.scrollHeight;
		}
	}
}
