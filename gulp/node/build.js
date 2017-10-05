'use strict';

const settings = Object.assign(
	require(process.cwd()+'/package.json').gulp,
	{name: require(process.cwd()+'/package.json').name}
);

const add = require('gulp-inject-string');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const removeCode = require('gulp-remove-code');
const uglify = require('gulp-uglify');

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


function fn(gulp, done) {
	gulp.src(settings.source)
		.pipe(concat(settings.name + '.node.js'))
		.pipe(removeCode({node:true}))
		.pipe(babel(babelConfig))
		.pipe(add.after('\'use strict\';\n', polyfill))
		.pipe(concat(settings.name + '.node.js'))
		.pipe(gulp.dest(process.cwd()+'/'+settings.dest))
		.on('end', ()=>gulp.src(settings.test.root + settings.test.unit + '/*.js')
			.pipe(concat('index.js'))
			.pipe(removeCode({node:true}))
			.pipe(babel(babelConfig))
			.pipe(add.after('\'use strict\';\n', polyfill))
			.pipe(gulp.dest(settings.test.root + settings.test.build))
			.on('end', done)
		)
}

module.exports = {deps: [], fn};
