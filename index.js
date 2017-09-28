'use strict';

const isNode = (()=>{
	try {
		return (module && module.exports);
	} catch (err){
		return false;
	}
})();

const Private = isNode?require("./lib/Private"):window.topic.Private;
const {makeArray, isString, isFunction, isObject, isRegExp, lopGen} = isNode?require("./lib/util"):window.topic;
const createError = isNode?require("./lib/errors"):window.topic.createError;

function _subscriptionAction(subscriptions, channel, action, subscription) {
	if (!subscriptions.has(channel)) subscriptions.set(channel, new Set());
	subscriptions.get(channel)[action](subscription);
}

function _subscriptionsAction(subscriptions, channels, action, subscription) {
	channels.forEach(channel=>_subscriptionAction(subscriptions, channel, action, subscription));
}

function _allChannelsAreCorrectType(channels, allowRegExp=true) {
	return (channels.filter(channel=>
		(isString(channel) ? (channel.charAt(0) === '/') : (allowRegExp?isRegExp(channel):false))
	).length === channels.length);
}

function* allAncestorChannels(channels) {
	const loppers = channels.map(channel=>lopGen(channel)());

	while (true) {
		let done = 0;
		for(let n=0; n<loppers.length; n++) {
			let value = loppers[n].next();
			if (!value.done) {
				yield value.value;
			} else {
				done++;
			}
		}
		if (done >= loppers.length) break;
	}
}

function _uniqueChannels(channels) {
	const uniqueChannels = new Set();

	const lopper = allAncestorChannels(channels);
	for(let channel of lopper) uniqueChannels.add(channel);

	return Array.from(uniqueChannels);
}

function _removingTrailingSlash(channel) {
	return (
		(isString(channel) && (channel.charAt(0) === '/')) ?
			'/'+channel.split('/').filter(part=>(part.trim() !== '')).join('/'):
			channel
	);
}

function _subscribe(subscriptions, channels, filter, callback) {
	if (!isFunction(callback)) throw createError(TypeError, 'CallbackNotFunction');
	if (!isObject(filter)) throw createError(TypeError, 'FilterNotAnObject');
	if (!_allChannelsAreCorrectType(channels)) throw createError(TypeError, 'ChannelNotAString');

	const subscription = {callback, filter};
	_subscriptionsAction(subscriptions, channels, 'add', subscription);
	return ()=>_subscriptionsAction(subscriptions, channels, 'delete', subscription);
}

function _publish(subscriptions, channels, message) {
	const _callbacks = new Set();

	subscriptions
		.forEach((callbacks, subscriptionChannel)=>{
			channels.filter(channel=>{
				if (isRegExp(subscriptionChannel)) return subscriptionChannel.test(channel);
			}).forEach(()=>{
				callbacks.forEach(callback=>_callbacks.add(callback.callback))
			});
		});

	channels.forEach(channel=>{
		if (subscriptions.has(channel)) {
			subscriptions.get(channel).forEach(subscription=>{
				_callbacks.add(subscription.callback);
			});
		}
	});

	_callbacks.forEach(callback=>callback(
		new Event(message, Object.freeze(channels))
	));

	return !!_callbacks.size;
}

function _broadcast(subscriptions, channels, message) {
	const _callbacks = new Set();

	subscriptions
		.forEach((callbacks, subscriptionChannel)=>{
			channels.filter(channel=>{
				if (isRegExp(subscriptionChannel)) return false;
				return (subscriptionChannel.substr(0, channel.length) === channel)
			}).forEach(()=>{
				callbacks.forEach(callback=>_callbacks.add(callback.callback))
			});
		});

	_callbacks.forEach(callback=>callback(
		new Event(message, Object.freeze(channels))
	));

	return !!_callbacks.size;
}

class Event {
	constructor(message, target) {
		Private.set(this, 'data', message);
		Private.set(this, 'target', target);
	}

	get data() {
		return Private.get(this, 'data');
	}

	get target() {
		return Private.get(this, 'target');
	}
}


/**
 * Publish and Subscription class.
 *
 * @class
 */
class PubSub {
	constructor() {

	}

	/**
	 * Subscribe to information published on a given channel(s) path with optional filtering. If a regular-expression is
	 * given for a channel it will receive published data but not broadcast data.
	 *
	 * @public
	 * @param {string|RegExp|Array.<string|RegExp>|Set.<string|RegExp>} channel		Channel(s) to subscribe to
	 * 																				(including glob-style patterns).
	 * @param {Object} [filter]														Filter to filter-out messages that
	 * 																				are not wanted.
	 * @param {Function} callback													Callback for caught messages.
	 * @returns {Function}															Unsubscribe function.
	 */
	subscribe(channel, filter, callback) {
		return _subscribe(
			Private.get(this, 'channels', Map),
			makeArray(channel).map(channel=>_removingTrailingSlash(channel)),
			callback?filter:{},
			callback?callback:filter
		);
	}

	/**
	 * Publish a message to the given channel(s). Publishing causes a message to be read on given channel and all
	 * parent channels.
	 *
	 * @public
	 * @param {string|Array|set} channel		Channel(s) to publish on (including glob-style patterns).
	 * @param {*} message						Message to publish.
	 * @returns {boolean}						Did the message publish?
	 */
	publish(channel, message) {
		const channels = makeArray(channel).map(channel=>_removingTrailingSlash(channel));
		if (!_allChannelsAreCorrectType(channels, false)) throw createError(TypeError, 'ChannelNotAString');
		return _publish(
			Private.get(this, 'channels', Map),
			_uniqueChannels(channels),
			message
		);
	}

	/**
	 * Broadcast a message to the given channel(s). Broadcasting causes a message to be read on given channel and all
	 * descendant channels. Will not be read on channel subscriptions that are regular-expressions.
	 *
	 * @public
	 * @param {string|Array|set} channel		Channel(s) to publish on (including glob-style patterns).
	 * @param {*} message						Message to publish.
	 * @returns {boolean}						Did the message publish?
	 */
	broadcast(channel, message) {
		const channels = makeArray(channel).map(channel=>_removingTrailingSlash(channel));
		if (!_allChannelsAreCorrectType(channels, false)) throw createError(TypeError, 'ChannelNotAString');
		return _broadcast(
			Private.get(this, 'channels', Map),
			channels,
			message
		);
	}
}

module.exports = PubSub;
