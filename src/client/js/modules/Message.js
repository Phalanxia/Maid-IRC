'use strict';

const autolinker = new Autolinker({
	stripPrefix: false,
	twitter: false,
	phone: false,
});

function headGenerator(head) {
	let _head = '';
	let _icon = '';

	// if (new format) else (old format)
	if (typeof head === 'object') {
		if (head[0] === 'text') {
			_head = head[1];
		} else if (head[0] === 'icon') {
			_head = '';
			_icon = `fa ${head[1]}`;
		}
	} else {
		_head = head;

		if (typeof _head !== 'undefined' && _head.length > 15) {
			_head = _head.substring(0, 13) + '...';
		}
	}

	return { _head, _icon };
}

class Message {
	constructor(raw, connectionId) {
		this.raw = raw;
		this.connectionId = connectionId;

		this.rawMessage = this.raw.message;

		// Channel
		this.channel = this.raw.channel || Maid.focusedSource;

		// Time
		this.rawTime = new Date();
		this.timestamp = `${('0' + this.rawTime.getHours()).slice(-2)}:` +
			`${('0' + this.rawTime.getMinutes()).slice(-2)}:` +
			`${('0' + this.rawTime.getSeconds()).slice(-2)}`;

		// Message nick / icon
		const headObj = headGenerator(this.raw.head);

		this.head = headObj._head;

		if (!headObj._icon) {
			this.icon = headObj._icon;
		}
	}

	display() {
		const output = select('#channel-console output');

		if (select('article.filler')) {
			// Remove the filler message the console
			output.removeChild(select('article.filler'));
		}

		// Insert message into the console
		output.insertAdjacentHTML('beforeend', Maid.Templates['src/client/views/message.hbs']({
			connectionId: this.connectionId,
			source: this.channel.toLowerCase(),
			type: this.raw.type,
			timestamp: this.timestamp,
			head: this.head,
			message: this.message,
			icon: this.icon,
		}));

		// Hide all messages
		selectAll('#channel-console output article').forEach(obj => {
			const _obj = obj;

			_obj.style.display = 'none';
		});

		// Show messages that are from the focused source
		selectAll(`#channel-console output article[data-source="${Maid.focusedSource.toLowerCase()}"][data-connection-id="${this.connectionId}"]`).forEach(obj => {
			const _obj = obj;

			_obj.style.display = '';
		});

		// Add filler message back
		output.insertAdjacentHTML('beforeend', '<article class="filler"><div></div></article>');
	}

	filter() {
		// Replace HTML unfriendly characters
		this.message = this.rawMessage
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		function highlight(name, input) {
			const exp = new RegExp('\\b(' + name + ')', 'ig');
			return input.replace(exp, '<span class="highlighted">$1</span>');
		}

		// Highlight nick if it's a message not from the server
		if (this.channel !== 'server' && this.raw.highlightable) {
			for (let i = 0; i < Maid.settings.highlights.length; i++) {
				this.message = highlight(Maid.settings.highlights[i], this.message);
			}
		}

		if (Maid.settings.messages.autolink) {
			// Wrap links in clickable link tags
			this.message = autolinker.link(this.message);
		}

		if (Maid.settings.messages.emojis) {
			// Add in emojis
			this.message = twemoji.parse(this.message);
		}
	}
}
