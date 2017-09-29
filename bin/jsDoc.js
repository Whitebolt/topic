/* jshint node: true */

'use strict';

const fs = require('fs');
const jsdoc = require('jsdoc-api');

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

fs.writeFileSync(
	'./test/index.json',
	JSON.stringify(parseJsDoc(__dirname + '/../index.js'))
);
