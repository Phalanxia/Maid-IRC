'use strict';

const select = document.querySelector.bind(document);
const selectAll = selection => Array.prototype.slice.call(document.querySelectorAll(selection));

// Modules
const ui = new UI();
const sources = new Sources(ui);
const incoming = new Incoming(ui, sources);
const connections = new Connections(ui, sources, incoming);
const outgoing = new Outgoing(connections);

const Maid = {
	settings: {
		awayMessage: 'Away',
		ignoreList: [],
		highlights: [],
		debug: false,
		messages: {
			emojis: true,
			autolink: true,
		},
	},

	// Connections
	focusedServer: '',
	focusedSource: '',
	sessions: {
		highlights: [],
	},

	version: select('#about .version').innerHTML.slice(16),

	getFocused() {
		return this.sessions[this.sessions.focusedServer];
	},

	init: () => {
		window.onbeforeunload = () => {
			if (Maid.connections.status) {
				return 'Leaving the page will disconnect you from IRC.';
			}
		};

		// Handle connection information
		select('#submit').onclick = event => {
			event.preventDefault();

			const connectInfo = {};
			let invalid = false;

			selectAll('#connect input').forEach(obj => {
				connectInfo[obj.name] = obj.value;

				// If the input is no longer invalid remove the invalid class
				if (obj.classList.contains && obj.validity.valid) {
					obj.classList.remove('invalid');
				}

				// If the input is invalid add the invalid class to the input
				if (!obj.validity.valid) {
					obj.classList.add('invalid');
					invalid = true;
				}
			});

			if (!invalid) {
				if (!connectInfo.realName.length) {
					connectInfo.realName = connectInfo.nick;
				}

				connections.newConnection(connectInfo);

				// Hide connection modal
				select('#pageCover').classList.remove('displayed');
				selectAll('.modal').forEach(obj => obj.classList.remove('displayed'));

				select('#connect form').reset();
			} else {
				select('#connect').classList.add('invalid');

				setTimeout(() => {
					select('#connect').classList.remove('invalid');
				}, 500);
			}
		};

		// Stop form redirect on submit
		select('#submit').submit = event => {
			event.preventDefault();
			return false;
		};

		function enterMessage() {
			const input = select('#channel-console footer input');
			outgoing.send(input.value);
			input.value = '';
		}

		select('#channel-console footer input').onkeydown = event => {
			if (event.which === 13) { // Enter Key
				enterMessage();
			}
		};

		select('#channel-console footer button').onclick = () => enterMessage();
	},
};

window.onload = () => {
	Maid.init();
};

function hideModals() {
	select('#pageCover').classList.remove('displayed');
	selectAll('.modal').forEach(obj => obj.classList.remove('displayed'));
}

select('#pageCover').onclick = () => hideModals();

selectAll('.modal header button').forEach(obj => {
	const _obj = obj;

	_obj.onclick = () => hideModals();
});

select('#channel-console .fa-bars').onclick = () => {
	if (select('#network-panel').classList.contains('collapsed')) {
		select('#network-panel').classList.remove('collapsed');
	} else {
		select('#network-panel').classList.add('collapsed');
	}
};

// Show settings modal
select('#network-panel header button.fa-cog').onclick = () => {
	select('#pageCover').classList.add('displayed');
	select('#settings').classList.add('displayed');
};

// Show connect modal
select('#network-panel footer button.fa-plus').onclick = () => {
	select('#pageCover').classList.add('displayed');
	select('#connect').classList.add('displayed');
};

// Settings navigation
selectAll('#settings nav > ul li').forEach((obj, index) => {
	const _obj = obj;

	_obj.onclick = () => {
		selectAll('#settings nav > ul li.focused').forEach(focusedObj => {
			focusedObj.classList.remove('focused');
		});

		_obj.classList.add('focused');

		selectAll('#settings .page').forEach(page => {
			const _page = page;

			_page.style.display = 'none';
		});

		select(`#settings .page:nth-of-type(${index + 1})`).style.display = 'block';
	};
});

// Connection screen
selectAll('#connect footer button.fa-gear').forEach(obj => {
	const _obj = obj;

	_obj.onclick = () => {
		if (select('#connect-basic').style.display === 'none') {
			select('#connect-advanced').style.display = 'none';
			select('#connect-basic').style.display = 'block';
		} else {
			select('#connect-advanced').style.display = 'block';
			select('#connect-basic').style.display = 'none';
		}
	};
});
