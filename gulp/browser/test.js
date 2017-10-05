'use strict';

const settings = require(process.cwd()+'/package.json').gulp;
const nodeVersion = parseFloat(process.versions.node.split('.').slice(0, 2).join('.'));

function fn(gulp, done) {
	if (nodeVersion >= 7.6) {
		const chrome = require('gulp-mocha-chrome');
		return gulp.src(settings.test.root + settings.test.unit + '/browser.html')
			.pipe(chrome());
	} else {
		console.log('No browser testing in node versions < 7.6.  You can still run them manually.');
		done();
	}
}

module.exports = {deps: ["browser:build"], fn};