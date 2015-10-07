'use strict';

const grunt = require('grunt');

module.exports = function(grunt) {
	const pkg = grunt.file.readJSON('package.json');
	const version = pkg.version;

	grunt.initConfig({
		shell: {
			install: {
				options: {
					stdout: false,
					stderr: false,
					stdin: false
				},
				command: 'npm install'
			}
		}
	});

	// Load grunt contribution tasks.

	// Load third-party tasks
	grunt.loadNpmTasks('grunt-shell');

	// Override default tasks or some magic
	grunt.registerTask('default', []);

	grunt.registerTask('install', function() {
		grunt.log.writeln('Installing Dependencies');
		grunt.task.run(['shell:install']);
	});
};
