class UI {
	topic(topic) {
		select('#channel-console header input').value = topic || '';
	}

	users(connectionId, channel) {
		// Clear users bar
		select('#users ul').innerHTML = '';
		select('#users header p').innerHTML = '';

		// Set up user list
		const network = Maid.sessions[connectionId];
		const users = network.sources[channel].users;
		let userList = [];

		userList = Object.keys(users);

		// Sort the user list based on rank and alphabetization
		userList.sort((a, b) => {
			const rankString = '\r+%@&~';
			const rankA = rankString.indexOf(users[a]);
			const rankB = rankString.indexOf(users[b]);
			let rankSort;

			if (rankA === rankB) {
				rankSort = 0;
			} else {
				if (rankA > rankB) {
					rankSort = 1;
				} else {
					rankSort = -1;
				}
			}

			if (rankSort === 0) {
				return a.toLowerCase() < b.toLowerCase() ? 1 : -1;
			}

			return rankSort;
		});

		userList.forEach((element) => {
			const identifyer = {
				rank: users[element],
				icon: '',
			};

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
					default:
						identifyer.icon = '';
						break;
				}
			}

			// Display the user in the list
			select('#users ul').insertAdjacentHTML('afterbegin',
				Maid.Templates['src/client/views/users.hbs']({
					rank: identifyer.rank,
					icon: identifyer.icon,
					nick: element,
				}
			));
		});

		// Get user count
		select('#users header p').innerHTML = `${userList.length} users`;
	}
}
