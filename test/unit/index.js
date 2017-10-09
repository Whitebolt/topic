/* jshint node: true, mocha: true */
/* global chai */

//removeIf(browser)
'use strict';

const packageInfo = require(process.cwd()+'/package.json');
const jsDoc = tryRequire('./index.json');
const PubSub = require(process.cwd());
const chai = require('chai');
const EventEmitter = require('events');
const assert = chai.assert;

function tryRequire(moduleId, defaultValue) {
	try {
		return require(moduleId);
	} catch(err) {
		return ((defaultValue !== undefined)?defaultValue:{});
	}
}
//endRemoveIf(browser)

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
		return '';
	}
}

function getPubSubInstance() {
	try {
		return new PubSub();
	} catch (err) {
		return $("<div>").appendTo($("body")).pubsub();
	}
}

function runner() {
	describe(describeItem(packageInfo), ()=>{
		describe(describeItem(jsDoc, 'PubSub'), ()=>{
			describe(describeItem(jsDoc, 'PubSub#subscribe'), ()=>{
				const topics = getPubSubInstance();

				//removeIf(browser)
				it('The subscribe method should return a function.', ()=>{
					assert.isFunction(topics.subscribe('/my-test-channel', ()=>{}));
				});
				//endRemoveIf(browser)

				//removeIf(node)
				it('The subscribe method should return a jQuery-style object.', ()=>{
					assert.instanceOf(topics.subscribe('/my-test-channel', ()=>{}), $);
					assert.isFunction(topics.subscribe('/my-test-channel', ()=>{}).on);
					assert.isFunction(topics.subscribe('/my-test-channel', ()=>{}).trigger);
					assert.isFunction(topics.subscribe('/my-test-channel', ()=>{}).filter);
				});
				//endRemoveIf(node)

				describe('Subscribe should throw if wrong types supplied.', ()=>{
					it('The subscribe method should throw if one or more channels not a string.', ()=>{
						assert.throws(()=>topics.subscribe(null, ()=>{}), TypeError);
						assert.throws(()=>topics.subscribe(true, ()=>{}), TypeError);
						assert.throws(()=>topics.subscribe(['/test', null], ()=>{}), TypeError);
						assert.throws(()=>topics.subscribe(new Set(['/test', '/test2', {}]), ()=>{}), TypeError);
						assert.throws(()=>topics.subscribe('test', ()=>{}), TypeError);
						assert.doesNotThrow(()=>topics.subscribe('/test', ()=>{}), TypeError);
					});

					it('The subscribe method should throw if callback is not a function.', ()=>{
						assert.throws(()=>topics.subscribe('/test', null), TypeError);
						assert.throws(()=>topics.subscribe('/test', {}), TypeError);
					});

					it('The subscribe method should throw if filter is not an object.', ()=>{
						assert.throws(()=>topics.subscribe('/test', null, ()=>{}), TypeError);
						assert.throws(()=>topics.subscribe('/test', 'filter me', ()=>{}), TypeError);
					});
				});

				//removeIf(browser)
				it('Subscribe should return a useable unsubscribe function.', ()=>{
					const topics = getPubSubInstance();

					let called = false;
					const unsubscribe = topics.subscribe('/test', ()=>{
						called = true;
					});
					unsubscribe();

					topics.publish('/test', 'TEST MESSAGE');
					assert.isFalse(called, 'Subscription not fired.');
				});
				//endRemoveIf(browser)

				it('Subscribe should subscribe to multiple channels when given arrays.', ()=> {
					const topics = getPubSubInstance();

					let called = 0;
					topics.subscribe(['/test', '/extra', '/more'], ()=>{
						called++;
					});

					topics.publish('/test', 'TEST MESSAGE');
					assert.isTrue(!!called, 'Subscription not fired.');
					assert.equal(called, 1);
					topics.publish('/more', 'TEST MESSAGE');
					topics.publish('/extra', 'TEST MESSAGE');
					assert.equal(called, 3);
				});

				it('Subscribe should subscribe to multiple channels when given sets.', ()=> {
					const topics = getPubSubInstance();

					let called = 0;
					topics.subscribe(new Set(['/test', '/extra', '/more']), ()=>{
						called++;
					});

					topics.publish('/test', "TEST MESSAGE");
					assert.isTrue(!!called, "Subscription not fired.");
					assert.equal(called, 1);
					topics.publish('/more', "TEST MESSAGE");
					topics.publish('/extra', "TEST MESSAGE");
					assert.equal(called, 3);
				});

				it('Subscribe should subscribe to multiple channels when given an array/set of mixed strings and regular expressions - these should fire up the tree. Each callback should fire once.', ()=> {
					const topics = getPubSubInstance();

					let called = 0;
					topics.subscribe(new Set(['/test', /test\/(?:extra|more)\//]), ()=>{
						called++;
					});

					topics.publish('/test', 'TEST MESSAGE');
					assert.isTrue(!!called, 'Subscription not fired.');
					assert.equal(called, 1);
					topics.publish('/test/more/extreme', 'TEST MESSAGE');
					topics.publish('/test/extra/extreme', 'TEST MESSAGE');
					assert.equal(called, 3);
					topics.publish('/test/extreme', 'TEST MESSAGE');
					assert.equal(called, 4);
				});
			});

			describe(describeItem(jsDoc, 'PubSub#publish'), ()=>{
				const topics = getPubSubInstance();

				//removeIf(browser)
				it('The publish method should return a boolean.', ()=>{
					assert.isBoolean(topics.publish('/my-test-channel', {}));
				});
				//endRemoveIf(browser)

				//removeIf(node)
				it('The publish method should return a jQuery style object.', ()=>{
					assert.instanceOf(topics.publish('/my-test-channel', {}), $);
					assert.isFunction(topics.publish('/my-test-channel', {}).on);
					assert.isFunction(topics.publish('/my-test-channel', {}).trigger);
					assert.isFunction(topics.publish('/my-test-channel', {}).filter);
				});
				//removeIf(node)

				describe('Publish should throw if wrong types supplied.', ()=>{
					it('The publish method should throw if one or more channels not a string.', ()=>{
						assert.throws(()=>topics.publish(null, {}), TypeError);
						assert.throws(()=>topics.publish(true, {}), TypeError);
						assert.throws(()=>topics.publish(['/test', null], {}), TypeError);
						assert.throws(()=>topics.publish(new Set(['/test', '/test2', {}]), {}), TypeError);
						assert.throws(()=>topics.publish('test', {}), TypeError);
						assert.throws(()=>topics.publish(/test/, {}), TypeError);
						assert.throws(()=>topics.publish(['/test', /test/], {}), TypeError);
						assert.doesNotThrow(()=>topics.publish('/test', {}), TypeError);
					});
				});

				describe('Published messages should be sent to subscribers on same or matching channels.', ()=>{
					it('Subscribed callbacks should fire when message sent on same channel.', ()=>{
						const topics = getPubSubInstance();
						let called = false;
						topics.subscribe('/test', message=>{
							called = true;
							assert.equal(message.data, 'TEST MESSAGE');
						});

						topics.publish('/test', 'TEST MESSAGE');
						assert.isTrue(called, 'Subscription not fired.');
					});

					it('Subscribed callbacks should fire up channel tree.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						['/test/extra/extreme', '/test/extra', '/test', '/'].forEach(channel=>{
							topics.subscribe(channel, message=>{
								called++;
								assert.equal(message.data, 'TEST MESSAGE');
							});
						});

						topics.publish('/test/extra/extreme', 'TEST MESSAGE');
						assert.isTrue(!!called, 'Subscription not fired.');
						assert.equal(called, 4, 'Subscriptions did not fire up tree.');
					});

					it('Subscribed callbacks should fire when more than one channel is published on.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						[
							'/test/extra/extreme',
							'/test/extra',
							'/test',
							'/',
							'/test/extra/extra-extreme'
						].forEach(channel=>{
							topics.subscribe(channel, message=>{
								called++;
								assert.equal(message.data, 'TEST MESSAGE');
							});
						});

						topics.publish([
							'/test/extra/extreme',
							'/test/extra/extra-extreme'
						], 'TEST MESSAGE');
						assert.isTrue(!!called, 'Subscription not fired.');
						assert.equal(called, 5, 'Subscriptions did not fire up tree.');
					});

					it('Subscribed callbacks should fire in deepest first order when firing up tree.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', ()=>{
							assert.equal(called, 3);
							called++;
						});
						topics.subscribe('/test/extra/extreme', ()=>{
							assert.equal(called, 0);
							called++;
						});
						topics.subscribe('/test', ()=>{
							assert.equal(called, 2);
							called++;
						});
						topics.subscribe('/test/extra', ()=>{
							assert.equal(called, 1);
							called++;
						});

						topics.publish('/test/extra/extreme', 'TEST MESSAGE');
					});

					it('Subscribed callbacks should fire on RegExp channel matchers.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;
						topics.subscribe(/test\/(?:extra|more)\//, message=>{
							called++;
							assert.equal(message.data, 'TEST MESSAGE');
						});

						topics.publish('/test/extra/extreme', 'TEST MESSAGE');
						topics.publish('/test/more/extreme', 'TEST MESSAGE');
						topics.publish('/test/zero/extreme', 'TEST MESSAGE');
						topics.publish('/test/more', 'TEST MESSAGE');
						assert.isTrue(!!called, 'Subscription not fired.');
						assert.equal(called, 2, 'Subscriptions did not fire on RegExp matches.');
					});
				});


				it('Filters should be applied when given, according to the sift rules.', ()=>{
					const topics = getPubSubInstance();
					let called = 0;

					topics.subscribe('/test', {priority:{$gt:2}}, message=>{
						called++;
					});

					topics.publish('/test/extra/extreme', {
						priority: 4,
						description: "Message at level 4"
					});

					topics.publish('/test/extra/extreme', {
						priority: 3,
						description: "Message at level 3"
					});

					topics.publish('/test/extra/extreme', {
						priority: 1,
						description: "Message at level 1"
					});

					assert.equal(called, 2, 'Filter did not run correctly.');
				});

				//removeIf(browser)
				it('Publish should return whether a callback was fired.', ()=>{
					const topics = getPubSubInstance();

					topics.subscribe('/test', message=>{});

					assert.isTrue(topics.publish('/test', 'TEST MESSAGE'));
					assert.isFalse(topics.publish('/extra', 'TEST MESSAGE'));
				});
				//endRemoveIf(browser)
			});

			describe(describeItem(jsDoc, 'PubSub#broadcast'), ()=>{
				const topics = getPubSubInstance();

				//removeIf(browser)
				it('The broadcast method should return a boolean.', ()=>{
					assert.isBoolean(topics.broadcast('/test', {}));
				});
				//endRemoveIf(browser)

				//removeIf(node)
				it('The broadcast method should return a jQuery-style object.', ()=>{
					assert.instanceOf(topics.broadcast('/my-test-channel', ()=>{}), $);
					assert.isFunction(topics.broadcast('/my-test-channel', {}).on);
					assert.isFunction(topics.broadcast('/my-test-channel', {}).trigger);
					assert.isFunction(topics.broadcast('/my-test-channel', {}).filter);
				});
				//endRemoveIf(node)

				describe('Broadcast should throw if wrong types supplied.', ()=>{
					it('The broadcast method should throw if one or more channels not a string.', ()=>{
						assert.throws(()=>topics.publish(null, {}), TypeError);
						assert.throws(()=>topics.publish(true, {}), TypeError);
						assert.throws(()=>topics.publish(['/test', null], {}), TypeError);
						assert.throws(()=>topics.publish(new Set(['/test', '/test2', {}]), {}), TypeError);
						assert.throws(()=>topics.publish('test', {}), TypeError);
						assert.throws(()=>topics.publish(/test/, {}), TypeError);
						assert.throws(()=>topics.publish(['/test', /test/], {}), TypeError);
						assert.doesNotThrow(()=>topics.publish('/test', {}), TypeError);
					});
				});

				describe('Broadcast messages should be sent to subscribers on same or matching channels.', ()=> {
					const topics = getPubSubInstance();

					it('Subscribed callbacks should fire when message broadcast on same channel.', ()=>{
						let called = false;
						topics.subscribe('/test/extra/extreme', message=>{
							called = true;
							assert.equal(message.data, 'TEST MESSAGE');
						});

						topics.broadcast('/test/extra/extreme', 'TEST MESSAGE');
						assert.isTrue(called, 'Subscription not fired.');
					});

					it('Subscribed callbacks should fire when message broadcast on ancestor channel.', ()=>{
						let called = 0;
						topics.subscribe('/test/extra/extreme', message=>{
							called++;
							assert.equal(message.data, 'TEST MESSAGE');
						});
						topics.subscribe(['/test/extra/more', '/test/more/extra'], message=>{
							called++;
							assert.equal(message.data, 'TEST MESSAGE');
						});

						topics.broadcast('/test', 'TEST MESSAGE');
						assert.isTrue(!!called, 'Subscription not fired.');
						assert.equal(called, 2);
					});

					//removeIf(browser)
					it('Broadcast should return whether a callback was fired.', ()=>{
						const topics = getPubSubInstance();

						topics.subscribe('/test/extra/extreme', ()=>{});

						assert.isTrue(topics.broadcast('/test', 'TEST MESSAGE'));
						assert.isTrue(topics.broadcast('/test/extra', 'TEST MESSAGE'));
						assert.isFalse(topics.broadcast('/extra', 'TEST MESSAGE'));
						assert.isTrue(topics.broadcast('/', 'TEST MESSAGE'));
					});
					//endRemoveIf(browser)
				});

				it('Subscribed callbacks should fire when message broadcast on ancestor channel and filter matches.', ()=>{
					const topics = getPubSubInstance();
					let called = 0;
					topics.subscribe('/test/extra/extreme', {priority: {$lt: 3}}, ()=>{
						called++;
					});
					topics.subscribe(['/test/extra/more', '/test/more/extra'], {priority: {$gt: 1}}, ()=>{
						called++;
					});

					topics.broadcast('/test', {
						priority: 1,
						description: 'Message priority 1'
					});
					assert.equal(called, 1);
				});
			});

			describe(describeItem(jsDoc, 'PubSub#unsubscribe'), ()=>{
				const topics = getPubSubInstance();

				//removeIf(browser)
				it('The unsubscribe method should return a boolean.', ()=>{
					assert.isBoolean(topics.unsubscribe('/test'));
					assert.isBoolean(topics.unsubscribe(()=>{}));
				});
				//endRemoveIf(browser)

				//removeIf(node)
				it('The broadcast method should return a jQuery-style object.', ()=>{
					assert.instanceOf(topics.unsubscribe('/test'), $);
					assert.isFunction(topics.unsubscribe('/test').on);
					assert.isFunction(topics.unsubscribe(()=>{}).trigger);
					assert.isFunction(topics.unsubscribe(()=>{}).filter);
				});
				//endRemoveIf(node)

				describe('Unsubscribe should unsubscribe given listeners or all listeners on a given channel.', ()=>{
					it('Unsubscribe should remove all listeners on given channel.', ()=>{
						let called = 0;
						topics.subscribe('/test', ()=>called++);
						topics.subscribe('/test', ()=>called++);
						topics.subscribe('/test', ()=>called++);
						topics.publish('/test', 'TEST MESSAGE');
						assert.equal(called, 3);
						topics.unsubscribe('/test');
						topics.publish('/test', 'TEST MESSAGE');
						assert.equal(called, 3);
					});

					it('Unsubscribe should remove all listeners on all given channels.', ()=>{
						let called = 0;
						topics.subscribe('/test/1', ()=>called++);
						topics.subscribe('/test/2', ()=>called++);
						topics.subscribe('/test/3', ()=>called++);
						topics.broadcast('/test', 'TEST MESSAGE');
						assert.equal(called, 3);
						topics.unsubscribe(['/test/1', '/test/2', '/test/3']);
						topics.broadcast('/test', 'TEST MESSAGE');
						assert.equal(called, 3);
					});

					it('Unsubscribe should remove given listeners wherever they are subscribed.', ()=>{
						let called = 0;
						let listener = ()=>called++;

						topics.subscribe('/test/1', listener);
						topics.subscribe('/test/2', listener);
						topics.subscribe('/test/3', listener);
						topics.broadcast('/test', 'TEST MESSAGE');
						assert.equal(called, 1);
						topics.unsubscribe(listener);
						topics.publish('/test/1', 'TEST MESSAGE');
						topics.publish('/test/2', 'TEST MESSAGE');
						topics.publish('/test/3', 'TEST MESSAGE');
						assert.equal(called, 1);
					});
				});
			});

			describe(describeItem(jsDoc, 'PubSub#mirror'), ()=>{
				const topics = getPubSubInstance();

				//removeIf(browser)
				it('The mirror method should return a boolean.', ()=>{
					assert.isBoolean(topics.mirror({}));
					assert.isFalse(topics.mirror({}));
				});
				//endRemoveIf(browser)

				//removeIf(node)
				it('The mirror method should return a jQuery-style object.', ()=>{
					assert.instanceOf(topics.unsubscribe('/test'), $);
					assert.isFunction(topics.unsubscribe('/test').on);
					assert.isFunction(topics.unsubscribe(()=>{}).trigger);
					assert.isFunction(topics.unsubscribe(()=>{}).filter);
				});
				//endRemoveIf(node)

				describe('Messages should be mirrored to pubsub instance.', ()=>{
					it('Correctly formatted messages should just mirror.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>{
							called++;
							assert.equal(message.data, 'Hello World')
						});

						topics.subscribe('/test', message=>called++);
						topics.subscribe('/test/deep-test', message=>called++);
						topics.subscribe('/test/deep-test/even-deeper', message=>called++);

						topics.mirror({
							data: 'Hello World',
							target: ['/test/deep-test'],
							publish: true
						});

						assert.equal(called, 3);
					});

					it('If broadcast is set then message should broadcast.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>called++);
						topics.subscribe('/test', message=>called++);
						topics.subscribe('/test/deep-test', message=>called++);
						topics.subscribe('/test/deep-test/even-deeper', message=>called++);

						topics.mirror({
							data: 'Hello World',
							target: ['/'],
							broadcast: true
						});

						assert.equal(4, called);
					});
				});

				describe('Messages have default data and publish/broadcast.', ()=>{
					it('Data should default to empty object.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/test', message=>{
							called++;
							assert.deepEqual(message, {});
						});

						topics.mirror({
							data: 'Hello World',
							target: ['/test']
						});

						assert.equal(1, called);
					});

					it('Target channel should default to base if no channels given.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/test', message=>called++);

						topics.mirror({data: 'Hello World'}, [], '/test');

						assert.equal(1, called);
					});

					it('Target channel should default to root "/" if channels or base given.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>called++);

						topics.mirror({data: 'Hello World'});

						assert.equal(1, called);
					});

					it('Message data should default to empty object when message supplied', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>{
							called++;
							assert.deepEqual(message, {});
						});

						topics.mirror();

						assert.equal(1, called);
					});

					it('Publish/Broadcast should default to publish.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>called++);
						topics.subscribe('/test', message=>called++);
						topics.subscribe('/test/deep-test', message=>called++);
						topics.subscribe('/test/deep-test/even-deeper', message=>called++);

						topics.mirror({
							data: 'Hello World',
							target: ['/test/deep-test']
						});

						assert.equal(3, called);
					});
				});

				describe('Parsers should modify message and base should change the publish/broadcast channel.', ()=>{
					it('Base should change the broadcast/publish base.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>called++);
						topics.subscribe('/test', message=>called++);
						topics.subscribe('/test/deep-test', message=>called++);
						topics.subscribe('/test/deep-test/even-deeper', message=>called++);

						topics.subscribe('/external', message=>called++);
						topics.subscribe('/external/test', message=>called++);
						topics.subscribe('/external/test/deep-test', message=>called++);
						topics.subscribe('/external/test/deep-test/even-deeper', message=>called++);

						topics.mirror({
							data: 'Hello World',
							target: ['/'],
							broadcast: true
						}, [], '/external');

						assert.equal(4, called);
					});

					it('Base should be applied to all channels.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>called++);
						topics.subscribe('/test2', message=>called++);
						topics.subscribe('/test1', message=>called++);

						topics.subscribe('/external', message=>called++);
						topics.subscribe('/external/test1', message=>called++);
						topics.subscribe('/external/test2', message=>called++);

						topics.mirror({
							data: 'Hello World',
							target: ['/test1', '/test2'],
							publish: true
						}, [], '/external');

						assert.equal(4, called);
					});

					it('Parsers should modify the message.', ()=>{
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/', message=>called++);
						topics.subscribe('/test2', message=>called++);
						topics.subscribe('/test', message=>called++);

						topics.mirror({
							data: 'Hello World',
							target: ['/test'],
							publish: true
						}, [message=>{
							message.target = ['/test2'];
							return message;
						}]);

						assert.equal(called, 2);
					});

					it('Parsers should receive the message and base.', ()=>{
						const topics = getPubSubInstance();
						const originalMessage = {
							data: 'Hello World',
							target: ['/test'],
							publish: true
						};

						topics.mirror(originalMessage, [(message, base)=>{
							assert.deepEqual(message, originalMessage);
							assert.equal(base, '/external');
							return message;
						}], '/external');
					});

					it('Parsers should fire in sequence.', ()=> {
						const topics = getPubSubInstance();
						let called = 0;

						topics.subscribe('/test2', message=>{
							called++;
							assert.equal('Modified Message', message.data);
						});

						topics.mirror({
							data: 'Hello World',
							target: ['/test'],
							publish: true
						}, [message=>{
							message.data = 'Modified Message';
							return message;
						}, message=>{
							message.target = ['/test2'];
							return message;
						}]);

						assert.equal(1, called);
					});
				});
			});

			describe(describeItem(jsDoc, 'PubSub#source'), ()=>{
				describe('Default sources should work out-of-the-box.', ()=>{
					describe('Source should accept native node style emitters as sources.', ()=>{

						it('Events from node native emitters should mirror according to base requested.', ()=> {
							const events = new EventEmitter();
							const topics = getPubSubInstance();

							let called = 0;

							topics.source(events, 'load', {base: '/loaded'});
							topics.subscribe('/loaded', message=>called++);

							events.emit('load');

							assert.equal(1, called);
						});

						it('Events from node native emitters should mirror using the supplied parsers.', ()=> {
							const events = new EventEmitter();
							const topics = getPubSubInstance();

							let called = 0;
							let data = {
								target: 'base object',
								type: 'fire-up'
							};

							topics.source(events, 'load', {base: '/loaded', parsers:(message, base)=>{
								return {
									data: message,
									target: '/server',
									broadcast: true
								};
							}});

							topics.subscribe('/loaded/server', message=>called++);
							topics.subscribe('/loaded/server/base', message=>{
								assert.deepEqual(message.data, data);
								called++;
							});

							events.emit('load', data);

							assert.equal(2, called);
						});
					});

					describe('Source should accept PubSub style emitters as sources.', ()=>{
						it('Messages from PubSub should just mirror.', ()=> {
							const topics1 = getPubSubInstance();
							const topics2 = getPubSubInstance();

							let called = 0;

							topics2.subscribe('/', message=>called++);
							topics1.publish('/test');
							assert.equal(called, 0);
							//removeIf(node)
							topics2.source(topics1, {type: "PubSub"});
							//endRemoveIf(node)
							//removeIf(browser)
							topics2.source(topics1);
							//endRemoveIf(browser)
							topics1.publish('/test');
							assert.equal(called, 1);
						});
					});

					//removeIf(node)
					describe('Source should accept jQuery style emitters as sources.', ()=>{
						it('Events from jQuery emitters should mirror though via source.', ()=> {
							const events = jQuery("script");
							const topics = getPubSubInstance();

							let called = 0;

							topics.source(events, 'test-event', {parsers:message=>{
								message.target = '/test'
							}});
							topics.subscribe('/test', message=>called++);

							events.trigger('test-event');

							assert.equal(called, events.length);
						});
					});

					describe('Source should accept DOM style emitters as sources.', ()=>{
						it('Events from DOM emitters should mirror though via source.', ()=> {
							const events = jQuery("script").get(0);
							const topics = getPubSubInstance();

							let called = 0;

							topics.source(events, 'test-event', {parsers:message=>{
								message.target = '/test'
							}});
							topics.subscribe('/test', message=>called++);

							events.dispatchEvent(new Event('test-event'));

							assert.equal(called, 1);
						});
					});
					//endRemoveIf(node)

					describe('User defined sources can be used via options method "on".', ()=>{
						it('Events from node native emitters should mirror according to base requested.', ()=> {
							const events = new EventEmitter();
							const topics = getPubSubInstance();

							let called = 0;

							topics.source(events, 'load', {base: '/loaded', on:'once'});
							topics.subscribe('/loaded', message=>called++);

							events.emit('load');
							events.emit('load');

							assert.equal(called, 1);
						});
					});
				});

				describe('PubSub sources should accept a filter.', ()=>{
					it('Filters should be used if present.', ()=> {
						const topics1 = getPubSubInstance();
						const topics2 = getPubSubInstance();

						let called = 0;

						topics2.subscribe('/', message=>called++);
						topics2.source(topics1, {
							filter:  {level:{$gt:3}}
							//removeIf(node)
							, type: "PubSub"
							//endRemoveIf(node)
						});

						topics1.publish('/errors', {
							type: 'error',
							level: 3
						});

						topics1.publish('/errors', {
							type: 'error',
							level: 4
						});

						assert.equal(1, called);
					});
				});
			});
		});
	});

	//removeIf(node)
	mocha.run();
	//endRemoveIf(node)
}

//removeIf(browser)
runner();
//endRemoveIf(browser)