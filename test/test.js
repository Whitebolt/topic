/* jshint node: true, mocha: true */
/* global chai */


'use strict';

const packageInfo = require('../package.json');
const jsDoc = require('./index.json');
const PubSub = require('../');
const chai = require('chai');
const assert = chai.assert;


/**
 * Generate a description for a describe clause using the info in an object.
 *
 * @private
 * @param {Object} items        The object to get a description from.
 * @param {string} [itemName]   If supplied the property of items to get from.
 * @returns {string}
 */
function describeItem(items, itemName) {
	try {
		if (itemName) return items[itemName].name + '(): ' + items[itemName].description;
		return items.name + ': ' + items.description;
	} catch(err) {
		throw new SyntaxError('Could not find the requested item: ' + itemName);
	}
}


describe(describeItem(packageInfo), ()=>{
	describe(describeItem(jsDoc, 'PubSub'), ()=>{
		describe(describeItem(jsDoc, 'PubSub#subscribe'), ()=>{
		});

		describe(describeItem(jsDoc, 'PubSub#publish'), ()=>{
		});

		describe(describeItem(jsDoc, 'PubSub#broadcast'), ()=>{
		});
	});
});


