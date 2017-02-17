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

		describe(describeItem(jsDoc, 'PubSub#broadcast'), ()=>{
			it('Broadcasting should fire broadcast channel', ()=>{
				let topics = PubSub();
				let count = 0;

				topics.subscribe('/test', ()=>count++);

				topics.broadcast('/test', 'hello world');
				assert.equal(count, 1);
				topics.broadcast('/test', 'hello world');
				assert.equal(count, 2);
				topics.broadcast('/test', 'hello world');
				assert.equal(count, 3);
			});

			it('Broadcasting should fire broadcast channel and descendants', ()=>{
				let topics = PubSub();
				let count = 0;

				topics.subscribe('/test', ()=>count++);
				topics.subscribe('/test/1', ()=>count++);
				topics.subscribe('/test/1/2/3/4/5', ()=>count++);

				topics.broadcast('/test', 'hello world');
				assert.equal(count, 3);
				topics.broadcast('/test', 'hello world');
				assert.equal(count, 6);
				topics.broadcast('/test', 'hello world');
				assert.equal(count, 9);
			});

			it('Broadcasting should take account of any filtering with * symbol', ()=>{
				let topics = PubSub();
				let count = 0;

				topics.subscribe('/test', ()=>count++);
				topics.subscribe('/test/1', ()=>count++);
				topics.subscribe('/test/1/2/3/4/5', ()=>count++);

				topics.broadcast('/test/*', 'hello world');
				assert.equal(count, 2);
				topics.broadcast('/test/**/2', 'hello world');
				assert.equal(count, 3);
				topics.broadcast('/test', 'hello world');
				assert.equal(count, 6);
			});
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

			it('The subscribe() method should accept arrays for the channel and subscribe to each channel in the array', ()=>{
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

			it('The subscribe function should be able to subscribe to parent channels and receive child messages', ()=>{
				let topics = PubSub();
				let count1 = 0;
				let count2 = 0;
				let count3 = 0;

				topics.subscribe('/test', ()=>count1++);
				topics.subscribe('/test/*', ()=>count2++);
				topics.subscribe('/test/1', ()=>count3++);

				topics.publish('/test', 'hello world');
				assert.equal(count1, 1);
				assert.equal(count2, 0);
				assert.equal(count3, 0);
				topics.publish('/test/1', 'hello world');
				topics.publish('/test/2', 'hello world');
				topics.publish('/test/3', 'hello world');
				assert.equal(count1, 4);
				assert.equal(count2, 3);
				assert.equal(count3, 1);
				topics.publish('/test/test/test', 'hello world');
				assert.equal(count1, 5);
				assert.equal(count2, 4);
				assert.equal(count3, 1);
			});

			it('The subscribe function should be able to subscribe to parent channels and receive child messages for specific grand-children with non-specfic parents', ()=>{
				let topics = PubSub();
				let count1 = 0;
				let count2 = 0;

				topics.subscribe('/test/*/test', ()=>count1++);
				topics.subscribe('/test/**/test', ()=>count2++);

				topics.publish('/test', 'hello world');
				assert.equal(count1, 0);
				assert.equal(count2, 0);
				topics.publish('/test/1', 'hello world');
				topics.publish('/test/2', 'hello world');
				topics.publish('/test/3', 'hello world');
				assert.equal(count1, 0);
				assert.equal(count2, 0);
				topics.publish('/test/test/test', 'hello world');
				assert.equal(count1, 1);
				assert.equal(count2, 1);
				topics.publish('/test/1/test', 'hello world');
				topics.publish('/test/2/test', 'hello world');
				topics.publish('/test/3/test', 'hello world');
				assert.equal(count1, 4);
				assert.equal(count2, 4);
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

			it('Subscribing using once() should fire only once when something is pulished on subscribed to channel', ()=>{
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


