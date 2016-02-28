const autolinker = new Autolinker({
	stripPrefix: false,
	twitter: false,
	phone: false,
});

class Message {
	constructor(raw, connectionId) {
		this.raw = raw;
		this.connectionId = connectionId;

		this.rawMessage = this.raw.message;

		// Channel
		this.channel = this.raw.channel || Maid.focusedSource;

		// Time
		this.rawTime = new Date();

		this.timestamp = `${(`0${this.rawTime.getHours()}`).slice(-2)}:${(`0${this.rawTime.getMinutes()}`).slice(-2)}:${(`0${this.rawTime.getSeconds()}`).slice(-2)}`;

		// Icon
		if (this.raw.icon) {
			this.icon = {
				cssClass: this.raw.icon[0],
				copyText: this.raw.icon[1],
			};
		}
	}

	display() {
		const output = select('#channel-console output');

		if (select('article.filler')) {
			// Remove the filler message the console
			output.removeChild(select('article.filler'));
		}

		// Make sure the source is displayed in the list
		if (!Maid.sessions[this.connectionId].sources[this.channel]) {
			sources.addToList(this.connectionId, this.channel);
		}

		// Insert message into the console
		output.insertAdjacentHTML('beforeend', Maid.Templates['src/client/views/message.hbs']({
			connectionId: this.connectionId,
			source: this.channel.toLowerCase(),
			type: this.raw.type,
			timestamp: this.timestamp,
			head: this.raw.head || '',
			message: this.message || '',
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
		output.insertAdjacentHTML('beforeend', '<article class="filler"><p></p></article>');
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
			const exp = new RegExp(`\\b(${name})`, 'ig');
			return input.replace(exp, '<span class="highlighted">$1</span>');
		}

		// Highlight nick if it's a message not from the server
		if (this.channel !== 'server' && this.raw.isHighlightable) {
			for (const i of Maid.settings.highlights) {
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
