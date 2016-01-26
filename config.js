'use strict';

const config = {
	// Host/Port which you want the webserver to serve on.
	HTTP_HOST: process.env.HOST || '0.0.0.0', // Change to '0.0.0.0' to make this public.
	HTTP_PORT: process.env.PORT || 4848,

	// HTTPS settings
	ENABLE_HTTPS: 0, // 0 = false, 1 = true, 2 = force
	HTTPS_PORT: 443,
	PRIVATE_KEY: '',
	CERTIFICATE: '',

 	/*
		Misc
	*/

	// Check GitHub for avaliable updates on startup
	CHECK_FOR_UPDATES: true,
};

module.exports = config;
