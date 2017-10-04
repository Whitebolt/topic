'use strict';

const settings = require(process.cwd()+'/package.json').gulp;

const fs = require('fs');
const jsdoc = require('jsdoc-api');
const mocha = require('gulp-mocha');

/**
 * Parse an input file for jsDoc and put json results in give output file.
 *
 * @param {string} filePath		File path to parse jsDoc from.
 * @returns {Object}			Parsed jsDoc data.
 */
function parseJsDoc(filePath) {
	const data = {};

	jsdoc.explainSync({files:[filePath]}).forEach(item=>{
		if (!item.undocumented && !data.hasOwnProperty(item.longname)) {
			data[item.longname] =  {
				name: item.name,
				description: item.classdesc || item.description
			};
		}
	});

	return data;
}

function fn(gulp) {
	fs.writeFileSync(
		process.cwd() + '/' + settings.test + '/index.json',
		JSON.stringify(parseJsDoc(process.cwd() + '/index.js'))
	);

	return gulp.src(settings.test + '/*.js', {read: false}).pipe(mocha())
}

module.exports = {deps: [], fn};