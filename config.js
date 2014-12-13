config = {
	// The location you want to log to
	logging_directory: '',
	// Host/Port which you want the webserver to serve on.
	http_host: process.env.HOST || '0.0.0.0', // Change to '0.0.0.0' to make this public.
	http_port: process.env.PORT || 80,
	// Https settings
	enable_https: 0, // 0 = false, 1 = true, 2 = force
	https_port: 443
};

module.exports = config;
