'use strict';

const settings = require(process.cwd()+'/package.json').gulp;

const mocha = require('gulp-mocha');

function fn(gulp) {
	return gulp.src(settings.test.root + settings.test.build + '/index.js', {read: false})
		.pipe(mocha())
}

module.exports = {deps: ['node:build', 'node:jsdoc-json'], fn};