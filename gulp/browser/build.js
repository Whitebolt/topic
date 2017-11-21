'use strict';

const settings = Object.assign(
	require(process.cwd()+'/package.json').gulp,
	{name: require(process.cwd()+'/package.json').name}
);

const add = require('gulp-inject-string');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const gutil = require('gulp-util');
const removeCode = require('gulp-remove-code');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const iife = require('gulp-iife');

const nodeVersion = parseFloat(process.versions.node.split('.').slice(0, 2).join('.'));

let polyfill = '';

const babelConfig = {
	presets: [
		[
			"env",
			{targets:{node:"current"}}
		]
	]
};

if (nodeVersion < 5) babelConfig.presets[0][1].include = ["babel-plugin-transform-es2015-spread"];
if (nodeVersion < 8) polyfill = 'require("babel-polyfill");\n';

function tryRequire(moduleId, defaultValue) {
	try {
		return require(moduleId);
	} catch(err) {
		return ((defaultValue !== undefined)?defaultValue:{});
	}
}

function fn(gulp, done) {
	const packageInfo = require(process.cwd()+'/package.json');
	const jsDoc = tryRequire(process.cwd() + '/' + settings.test.root + settings.test.build + '/index.json');

	gulp.src(settings.source)
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(concat(settings.name + '.js'))
		.pipe(removeCode({browser:true}))
		.pipe(iife())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(settings.dest))
		.on('end', ()=>gulp.src(settings.source)
			.pipe(sourcemaps.init({loadMaps: true}))
			.pipe(concat(settings.name + '.min.js'))
			.pipe(removeCode({browser:true}))
			.pipe(babel(settings.babel))
			.pipe(uglify().on('error', gutil.log))
			.pipe(iife())
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest(settings.dest))
			.on('end', ()=>gulp.src([
				settings.test.root + settings.test.mocks + '/browser/*.js',
				settings.test.root + settings.test.unit + '/*.js'
			])
				.pipe(concat('browser.js'))
				.pipe(removeCode({browser:true}))
				.pipe(babel(babelConfig))
				.pipe(add.after('\'use strict\';\n', 'const packageInfo = ' + JSON.stringify(packageInfo) + ';\n'))
				.pipe(add.after('\'use strict\';\n', 'const jsDoc = ' + JSON.stringify(jsDoc) + ';\n'))
				.pipe(add.after('\'use strict\';\n', polyfill))
				.pipe(gulp.dest(settings.test.root + settings.test.build))
				.on('end', done)
			)
		)
}

module.exports = {deps: ['node:jsdoc-json'], fn};
