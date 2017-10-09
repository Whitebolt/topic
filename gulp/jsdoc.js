'use strict';

const jsdoc = require('gulp-jsdoc3');
const settings = Object.assign(
	require(process.cwd()+'/package.json').gulp,
	{name: require(process.cwd()+'/package.json').name}
);


function fn(gulp, done) {
	gulp.src([
		'./lib/index.js',
		'./lib/Message.js'
	], {read: false})
		.pipe(jsdoc(settings.jsdoc, done));
}

module.exports = {deps: [], fn};
