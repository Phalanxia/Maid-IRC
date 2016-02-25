'use strict';

class Helpers {
	constructors() {}

	static stop(reason) {
		let _reason = reason;

		if (_reason) {
			_reason = `Reason: ${_reason}`;
		} else {
			_reason = '';
		}

		console.log(`
Gracefully shutting down. ${_reason}`);

		process.exit();
	}
}

module.exports = Helpers;
