'use strict';

class Helpers {
	constructors() {}

	stopMaid(reason) {
		if (reason) {
			reason = ' Reason: ' + reason;
		} else {
			reason = '';
		}

		console.log('\nGracefully shutting down.' + reason);
		process.exit();
	}
}

module.exports = new Helpers();
