'use strict';

const settings = require(process.cwd()+'/package.json').gulp;

const chrome = require('gulp-mocha-chrome');

function fn(gulp) {
	return gulp.src(settings.test.root + settings.test.unit + '/browser.html')
		.pipe(chrome());
}

module.exports = {deps: ["browser:build"], fn};