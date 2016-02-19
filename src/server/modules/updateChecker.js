'use strict';

function checkForUpdates(https, pjson) {
	const options = {
		hostname: 'api.github.com',
		port: 443,
		path: '/repos/Phalanxia/Maid-IRC/releases/latest',
		method: 'GET',
		headers: {
			'user-agent': pjson.name,
		},
	};

	https.get(options, (res) => {
		res.setEncoding('utf8');

		let data = '';

		res.on('data', chunk => {
			// Data comes in as chunks, add them together into one big string
			data += chunk;
		});

		res.on('end', () => {
			// Parse data as json
			data = JSON.parse(data);

			// Verify that the content of the response is usable and not a prerelease
			if (data.tag_name && data.html_url && !data.prerelease) {
				const semver = require('semver');

				// Remove 'v' from the front of the tag name (if it has one)
				data.tag_name = data.tag_name.replace(/^v/, '');

				// If running version is less than the latest
				if (semver.lt(pjson.version, data.tag_name)) {
					// Maid-IRC is out-to-date
					console.warn(`Maid-IRC is out-of-date. Running: ${pjson.version} Latest: ${data.tag_name}
Update here: ${data.html_url}`);
				} else {
					// Maid-IRC is up-to-date
					console.log('Maid-IRC is up-to-date. Awesome!');
				}
			}
		});
	}).on('error', (e) => {
		console.log(`Unable to check for updates. ${e}`);
	});
}

module.exports = checkForUpdates;
