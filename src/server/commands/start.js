'use strict';

// Dependencies
const program = require('commander');
const YAML = require('yamljs');

// Server
const MaidServer = require('../server');

// Config
const config = YAML.load('config.yml');

program
	.option('-p, --public', 'sets whether or not its running in public or private mode')
	.option('-ne, --node_env <node_env>', 'sets the node enviroment variable')
	.command('start')
	.description(`start Maid-IRC's server`)
	.action(function action() {
		// Forge the options object and hope there isn't a typo
		const options = {
			NODE_ENV: process.env.NODE_ENV || program.node_env || 'production',
			check_for_updates: process.env.check_for_updates || config.check_for_updates,
			http: {
				enabled: process.env.http_enabled || config.http.enabled,
				host: process.env.host || config.host,
				port: process.env.http_port || config.http.port,
			},
			https: {
				enabled: process.env.https_enabled || config.https.enabled,
				host: process.env.host || config.host,
				port: process.env.https_port || config.https.port,
				private_key: config.https.private_key,
				certificate: config.https.certificate,
			},
			public: program.public || process.env.public || config.public,
		};

		const server = new MaidServer(options);

		// Start the server
		server.start();
	});
