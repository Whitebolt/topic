'use strict';

const settings = require(process.cwd()+'/package.json').gulp;
const nodeVersion = parseFloat(process.versions.node.split('.').slice(0, 2).join('.'));

const fs = require('fs');

/**
 * Parse an input file for jsDoc and put json results in give output file.
 *
 * @param {string} filePath			File path to parse jsDoc from.
 * @param {Object} jsdoc			The jsdoc class.
 * @returns {Promise.<Object>}		Parsed jsDoc data.
 */
function parseJsDoc(filePath, jsdoc) {
	return jsdoc.explain({files:[filePath]}).then(items=>{
		const data = {};
		items.forEach(item=>{
			if (!item.undocumented && !data.hasOwnProperty(item.longname)) {
				data[item.longname] =  {
					name: item.name,
					description: item.classdesc || item.description
				};
			}
		});

		return data;
	});
}

/**
 * A promisified version of node native fs.write() for basic text content.
 *
 * @param {string} filepath		The path to write to.
 * @param {string} contents		The contents to write to filepath.
 * @returns {Promise}
 */
function write(filepath, contents) {
	return new Promise((resolve, reject)=>{
		fs.writeFile(filepath, contents, (err, response)=>{
			if (err) return reject(err);
			return resolve(response);
		})
	});
}

function fn(gulp, done) {
	if (nodeVersion >= 4.2) {
		const jsdoc = require('jsdoc-api');

		parseJsDoc(process.cwd() + '/lib/index.js', jsdoc).then(data=>{
			return write(process.cwd() + '/' + settings.test.root + settings.test.build + '/index.json', JSON.stringify(data));
		}).then(done);
	} else {
		console.log('Jsdoc-api module does not work in node < 4.2.  This means no nice print-outs in test suits.');
		done();
	}
}

module.exports = {deps: [], fn};