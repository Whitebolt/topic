'use strict';

const settings = require(process.cwd()+'/package.json').gulp;

const mocha = require('gulp-mocha');
const run = require('run-sequence');

function fn(gulp, done) {
	run('node:build', 'node:jsdoc-json', function() {
		return gulp.src(settings.test.root + settings.test.build + '/index.js', {read: false})
			.pipe(mocha())
			.on('end', done);
	});
}

module.exports = {deps: [], fn};