'use strict';

class UI {
	constructor() {
		this.autolinker = new Autolinker({
			 stripPrefix: false,
			 twitter: false,
			 phone: false,
		});
	}

	messageSources(connectionId) {
		let _this = this;

		// Remove all the current items in the list
		selectAll('#network-panel > ul').forEach(obj => obj.parentNode.removeChild(obj));

		// Render the template
		select('#network-panel header').insertAdjacentHTML('afterend', client.Templates['public/views/sources.hbs']({
				serverName: client.networks[connectionId].name || 'Server',
				connectionId: connectionId,
				sources: client.networks[connectionId].sources,
			})
		);

		function renderAll(connectionId, source, type) {
			let network = client.networks[connectionId];

			// If you're already viewing it, there's no point in this so lets do nothing
			if (source === network.focusedSource) {
				return;
			}

			client.networks.focusedServer = connectionId;
			network.focusedSource = source;

			// Reset focused source class
			selectAll('.message-source-list li').forEach(obj => obj.classList.remove('focusedSource'));

			switch (type.toLowerCase()) {
				case 'channel':
					const channel = network.sources[source];

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

			// Update displayed focused source in the networks panel
			select(`[data-connection-id="${connectionId}"][data-value="${source}"]`).classList.add('focusedSource');

			// Hide all messages
			selectAll('#channel-console output article').forEach(obj => {
				obj.style.display = 'none';
			});

			// Show messages that are from the focused source
			selectAll(`#channel-console output article[data-source="${client.networks[connectionId].focusedSource}"][data-connection-id="${connectionId}"]`).forEach(obj => {
				obj.style.display = '';
			});
		};

		selectAll('.message-source-list li').forEach(obj => {
			obj.onclick = () => {
				renderAll(obj.getAttribute('data-connection-id'), obj.getAttribute('data-value'), obj.className);

				const output = select('#channel-console output');
				output.scrollTop = output.scrollHeight;
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
		// Clear users bar
		select('#users ul').innerHTML = '';
		select('#users header p').innerHTML = '';

		// Set up user list.
		let network = client.networks[connectionId];
		let users = network.sources[channel].users;
		let userList = [];

		userList = Object.keys(users);

		// Sort the user list based on rank and alphabetization
		userList.sort(function(a, b) {
			const rankString = '\r+%@&~';
			const rankA = rankString.indexOf(users[a]);
			const rankB = rankString.indexOf(users[b]);

			let rankSort = rankA == rankB ? 0 : (rankA > rankB ? 1 : -1);
			if (rankSort === 0) {
				return a.toLowerCase() < b.toLowerCase() ? 1 : -1;
			}

			return rankSort;
		});

		userList.forEach((element, index, array) => {
			let identifyer = {};
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
			select('#users ul').insertAdjacentHTML('afterbegin', client.Templates['public/views/users.hbs']({
				rank: identifyer.rank,
				icon: identifyer.icon,
				nick: element,
			}));
		});

		// Get user count
		select('#users header p').innerHTML = `${userList.length} users`;
	}

	message(data, connectionId) {
		let NewMessage = new Message(data, connectionId);

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
}
