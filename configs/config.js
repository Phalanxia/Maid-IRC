config = {
	// The location you want to log to
	logging_directory: '',
	// Host/Port which you want the webserver to serve on.
	http_host: process.env.HOST || '0.0.0.0', // Change to '0.0.0.0' to make this public.
	http_port: process.env.PORT || 4848
};

module.exports = config;