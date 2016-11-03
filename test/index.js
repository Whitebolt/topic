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
	describe(describeItem(jsDoc, 'PubSub()'), ()=>{
		it('PubSub instances should be objects with publish, subscribe and once methods', ()=>{
			let topics = PubSub();

			assert.property(topics, 'publish');
			assert.isFunction(topics.publish);

			assert.property(topics, 'subscribe');
			assert.isFunction(topics.subscribe);

			assert.property(topics, 'once');
			assert.isFunction(topics.once);
		});

		describe(describeItem(jsDoc, 'PubSub#publish'), ()=>{

		});

		describe(describeItem(jsDoc, 'PubSub#subscribe'), ()=>{
			it('Subscribing should return an unsubscribe function', ()=>{
				let topics = PubSub();
				let count = 0;
				let unsubscribe = topics.subscribe('/test', ()=>count++);

				assert.isFunction(unsubscribe);

				topics.publish('/test', 'hello world');
				topics.publish('/test', 'hello world');
				unsubscribe();
				topics.publish('/test', 'hello world');
				topics.publish('/test', 'hello world');

				assert.equal(count, 2);
			});

			it('The subscribe() method should accept arrays for the channel and subscribe to each channel in the array.', ()=>{
				let topics = PubSub();
				let count = 0;
				let unsubscribe = topics.subscribe(['/test1', '/test2', '/test3', '/test4'], ()=>count++);
				topics.publish('/test1', 'hello world');
				assert.equal(count, 1);
				topics.publish('/test2', 'hello world');
				assert.equal(count, 2);
				topics.publish('/test3', 'hello world');
				assert.equal(count, 3);
				topics.publish('/test4', 'hello world');
				assert.equal(count, 4);
				topics.publish('/test5', 'hello world');
				assert.equal(count, 4);
			});
		});

		describe(describeItem(jsDoc, 'PubSub#once'), ()=>{
			it('Subscribing using once() should return an unsubscribe function', ()=>{
				let topics = PubSub();
				let count = 0;
				let unsubscribe1 = topics.once('/test1', ()=>count++);
				let unsubscribe2 = topics.once('/test2', ()=>count++);

				assert.isFunction(unsubscribe1);
				assert.isFunction(unsubscribe2);

				topics.publish('/test1', 'hello world');
				unsubscribe2();
				topics.publish('/test2', 'hello world');

				assert.equal(count, 1);
			});

			it('Subscribing using once() should fire only once when something is pulished on subscribed to channel.', ()=>{
				let topics = PubSub();
				let count = 0;
				let unsubscribe = topics.once('/test', ()=>count++);

				topics.publish('/test', 'hello world');
				topics.publish('/test', 'hello world');
				topics.publish('/test', 'hello world');

				assert.equal(count, 1);
			});
		});
	});
});


