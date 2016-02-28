class Sources {
	addServer(networkId) {
		const network = Maid.sessions[networkId];

		select('#message-source-list').insertAdjacentHTML('beforeend',
			Maid.Templates['src/client/views/sources.hbs']({
				networkId,
				network,
				networkName: network.networkName || network.serverGiven || 'Server',
			})
		);

		// Select the element we just inserted
		select(`.source-container[data-connection-id="${networkId}"] header`).onclick = () => {
			// Change focus on click
			this.changeFocus(networkId, 'server', 'server');
		};

		// If focusedSource is not set, set it to the server we just added
		if (!Maid.focusedSource) {
			this.changeFocus(networkId, 'server', 'server');
		}
	}

	addToList(networkId, source) {
		const networkSelector = `.source-container[data-connection-id="${networkId}"]`;

		// Verify that that the server is displayed in the list, if not, add it
		if (!select(networkSelector)) {
			this.addServer(networkId);
		}

		// Don't display duplicates
		if (select(`${networkSelector} li[data-source="${source}"]`) || source === 'server') {
			return;
		}

		// Determin what the type of source provided
		let type = 'channel';

		if (['#', '&', '!', '+'].indexOf(source.charAt(0)) === -1) {
			// TODO: Figure out how to determin if the message is from the server or a person (PM)
			if (source === 'server') {
				type = 'server';
			} else {
				type = 'other';
			}
		}

		const icon = type === 'other' ? 'fa-user' : 'fa-comments-o';

		const chosenNetwork = Maid.sessions[networkId];

		select(`${networkSelector} .channel-source-container`).insertAdjacentHTML('beforeend',
			Maid.Templates['src/client/views/source.hbs']({
				networkId,
				source,
				type,
				icon,
				sourceObj: chosenNetwork[source],
			})
		);

		// Select the element we just inserted and add an onclick event
		select(`${networkSelector} li[data-source="${source}"]`).onclick = () => {
			// Change focus on click
			this.changeFocus(networkId, source, type);
		};
	}

	removeFromList(networkId, source) {
		const networkSelector = `.source-container[data-connection-id="${networkId}"]`;

		// Verify that that the server is displayed in the list, if not, ???
		if (!select(networkSelector)) {
			return;
		}

		// Selected source element
		const listElement = select(`${networkSelector} ul li[data-source="${source}"]`);

		// Remove source from list
		listElement.parentNode.removeChild(listElement);
	}

	changeFocus(networkId, source, type) {
		const networkSelector = `.source-container[data-connection-id="${networkId}"]`;

		// Verify that that the server is displayed in the list, if not, add it
		if (!select(networkSelector)) {
			this.addServer(networkId);
		}

		Maid.focusedServer = networkId;
		Maid.focusedSource = source;

		// Remove the focusedSource class from every element that has it
		selectAll('.focusedSource').forEach(obj => obj.classList.remove('focusedSource'));

		const chosenNetwork = Maid.sessions[networkId];
		const sourceObj = chosenNetwork.sources[source];

		// Switch based off selected sourse type
		switch (type) {
			case 'channel': {
				// Update displayed focused source in the networks panel
				select(`${networkSelector} ul li[data-source="${source}"]`).classList.add('focusedSource');

				// Update displayed topic
				ui.topic(sourceObj.topic);

				// Allow the header input value (topic) to be edited
				select('#channel-console header input').disabled = false;

				// Update displayed users list
				ui.users(networkId, source);

				// Display the user list
				select('#users').style.display = 'block';
				break;
			}
			case 'pm': {
				// Update displayed focused source in the networks panel
				select(`${networkSelector} ul li[data-source="${source}"]`).classList.add('focusedSource');

				// Change header input value
				select('#channel-console header input').value = 'Private Message';

				// Disable the user from being able to edit the topic (there is no point to)
				select('#channel-console header input').disabled = true;

				// Hide the users list
				select('#users').style.display = 'none';
				break;
			}
			case 'server': {
				// Update displayed focused source in the networks panel
				select(`${networkSelector} header`).classList.add('focusedSource');

				// Change header input value to the name of the server
				select('#channel-console header input').value = chosenNetwork.networkName || chosenNetwork.serverGiven || 'Server';

				// Disable the user from being able to edit the topic (there is no point to)
				select('#channel-console header input').disabled = true;

				// Hide the users list
				select('#users').style.display = 'none';
				break;
			}
			case 'other': {
				// Update displayed focused source in the networks panel
				select(`${networkSelector} ul li[data-source="${source}"]`).classList.add('focusedSource');

				// Change header input value to the name of the server
				select('#channel-console header input').value = source;

				// Disable the user from being able to edit the topic (there is no point to)
				select('#channel-console header input').disabled = true;

				// Hide the users list
				select('#users').style.display = 'none';
				break;
			}
		}

		// Hide all messages
		selectAll('#channel-console output article:not(.filler)').forEach(obj => {
			const _obj = obj;

			_obj.style.display = 'none';
		});

		// Show messages that are from the focused source
		selectAll(`#channel-console output article[data-source="${source.toLowerCase()}"][data-connection-id="${networkId}"]`).forEach(obj => {
			const _obj = obj;

			_obj.style.display = '';
		});

		// Scroll to the bottom
		const output = select('#channel-console output');
		output.scrollTop = output.scrollHeight;
	}
}
