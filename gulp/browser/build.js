'use strict';

const settings = Object.assign(
	require(process.cwd()+'/package.json').gulp,
	{name: require(process.cwd()+'/package.json').name}
);

const babel = require('gulp-babel');
const concat = require('gulp-concat');
const gutil = require('gulp-util');
const iife = require("gulp-iife");
const removeCode = require('gulp-remove-code');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

function fn(gulp) {
	return gulp.src(settings.source)
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
			.pipe(babel())
			.pipe(uglify().on('error', gutil.log))
			.pipe(iife())
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest(settings.dest))
		);
}

module.exports = {deps: [], fn};
