'use strict';

module.exports = () => {
	const grunt = require('grunt');

	const pkg = grunt.file.readJSON('package.json');
	const version = pkg.version;

	grunt.initConfig({
		shell: {
			install: {
				options: {
					stdout: false,
					stderr: false,
					stdin: false,
				},
				command: 'npm install',
			},
			dist: {
				options: {
					stdout: true,
					stderr: true,
					stdin: false,
				},
				command: 'cd ./dist && npm install --production',
			},
		},

		concat: {
			options: {
				stripBanners: true,
			},
			dist: {
				src: [
					'src/client/js/modules/handlebars/Templates.js',
					'src/client/js/modules/Message.js',
					'src/client/js/modules/Interface.js',
					'src/client/js/modules/Sources.js',
					'src/client/js/modules/Incoming.js',
					'src/client/js/modules/Connections.js',
					'src/client/js/modules/Outgoing.js',
					'src/client/js/index.js',
				],
				dest: 'dist/src/client/built.js',
			},
			dependencies: {
				options: {
					banner: `/*! Maid-IRC - v${version} - ${grunt.template.today('yyyy-mm-dd')} */

'use strict';

`,
					stripBanners: true,
					process(src, filepath) {
						return `// Source: ${filepath}

${src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1')}`;
					},
				},
				src: [
					// Libraries
					'src/client/js/lib/Autolinker.min.js',
					'src/client/js/lib/handlebars.runtime.min.js',
					'src/client/js/lib/twemoji.min.js',
					'src/client/js/lib/uuid.js',
					// Compiled core code
					'src/client/app.js',
					// Precompiled templates
					'src/client/js/modules/handlebars/compiled.js',
				],
				dest: 'src/client/app.js',
			},
		},

		babel: {
			options: {
				comments: false,
			},
			development: {
				files: {
					'src/client/app.js': 'dist/src/client/built.js',
				},
			},
			dist: {
				files: {
					'dist/src/client/app.js': 'dist/src/client/built.js',
				},
			},
		},

		clean: {
			beforeDist: {
				src: ['dist/**/*'],
			},
			dist: {
				src: ['build', 'dist/src/client/built.js'],
			},
			afterDist: {
				src: ['dist/**/*', `!dist/maid-irc_v${version}.zip`],
			},
		},

		copy: {
			dist: {
				files: [
					{
						expand: true,
						src: [
							'src/client/**',
							'!src/client/js/**',
							'!src/client/css/**',
							'!src/client/less/**',
							'src/server/**',
							'screenshots/**',
						],
						dest: 'dist',
					},
					{
						src: ['src/index.js'],
						dest: 'dist/src/index.js',
					},
					{
						src: ['maid.js'],
						dest: 'dist/maid.js',
					},
					{
						src: ['config.yml'],
						dest: 'dist/config.yml',
					},
					{
						src: ['package.json'],
						dest: 'dist/package.json',
					},
					{
						src: ['README.md'],
						dest: 'dist/README.md',
					},
					{
						src: ['LICENSE'],
						dest: 'dist/LICENSE',
					},
				],
			},
			final: {
				files: [
					{
						src: ['src/client/app.js'],
						dest: 'dist/src/client/app.js',
					},
				],
			},
		},

		less: {
			development: {
				options: {
					paths: [],
				},
				files: {
					'src/client/css/client.css': 'src/client/less/client.less',
				},
			},
			dist: {
				options: {
					paths: [],
					plugins: [],
					compress: true,
					optimization: 0,
				},
				files: {
					'dist/src/client/css/client.css': 'src/client/less/client.less',
				},
			},
		},

		compress: {
			dist: {
				options: {
					archive: `dist/maid-irc_v${version}.zip`,
				},
				files: [
					{
						expand: true,
						cwd: './dist',
						src: ['**'],
					},
				],
			},
		},

		watch: {
			less: {
				files: ['src/client/less/*.less'],
				tasks: ['build:css'],
				options: {
					span: false,
				},
			},
			js: {
				files: [
					'src/client/js/**/*.js',
					'!src/client/js/modules/handlebars/compiled.js',
					'src/client/views/**/*.hbs',
				],
				tasks: ['handlebars:compile', 'build:js'],
				options: {
					span: false,
				},
			},
			handlebars: {
				files: ['src/client/views/**/*.hbs'],
				tasks: ['handlebars:compile'],
				options: {
					span: false,
				},
			},
		},

		handlebars: {
			options: {
				namespace: 'Maid.Templates',
				wrapped: true,
			},
			compile: {
				files: {
					'src/client/js/modules/handlebars/compiled.js': ['src/client/views/**/*.hbs'],
				},
			},
		},
	});

	// Load grunt contribution tasks
	grunt.loadNpmTasks('grunt-contrib-handlebars');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');

	// Load third-party tasks
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-babel');

	// Override default tasks or some magic
	grunt.registerTask('default', []);

	grunt.registerTask('install', function install() {
		grunt.log.writeln('Installing Dependencies');
		grunt.task.run(['shell:install']);
	});

	grunt.registerTask('build:js', function buildjs() {
		grunt.log.writeln(`Compiling Maid-IRC's client javascript`);
		grunt.task.run([
			'concat:dist',
			'babel:development',
			'handlebars:compile',
			'concat:dependencies',
			'clean:dist',
		]);
	});

	grunt.registerTask('build:less', function buildless() {
		grunt.log.writeln(`Compiling Maid-IRC's less files`);
		grunt.task.run([
			'less:development',
		]);
	});

	grunt.registerTask('build:handlebars', function buildhandlebars() {
		grunt.log.writeln(`Compiling Maid-IRC's handlebars files`);
		grunt.task.run([
			'handlebars:compile',
		]);
	});

	grunt.registerTask('build', function build() {
		grunt.log.writeln('Building Maid-IRC');
		grunt.task.run([
			'concat:dist',
			'babel:development',
			'handlebars:compile',
			'concat:dependencies',
			'clean:dist',
			'less:development',
		]);
	});

	grunt.registerTask('package', function packageTask() {
		grunt.log.writeln('Packaging Maid-IRC');
		grunt.task.run([
			'clean:beforeDist',
			'copy:dist',
			'concat:dist',
			'babel:dist',
			'handlebars:compile',
			'concat:dependencies',
			'copy:final',
			'less:dist',
			'clean:dist',
			'shell:dist',
			'compress:dist',
			'clean:afterDist',
		]);
	});
};
