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

function allChannelsAreCorrectType(channels) {
	return (channels.filter(channel=>
		(isString(channel) ? (channel.charAt(0) === '/') : isRegExp(channel))
	).length === channels.length);
}

function uniqueChannels(channels) {
	const uniqueChannels = new Set();
	channels.forEach(channel=>{
		const lopper = lopGen(channel);
		for(let channel of lopper()) uniqueChannels.add(channel);
	});
	return Array.from(uniqueChannels);
}

function _subscribe(subscriptions, channels, filter, callback) {
	if (!isFunction(callback)) throw createError(TypeError, 'CallbackNotFunction');
	if (!isObject(filter)) throw createError(TypeError, 'FilterNotAnObject');
	if (!allChannelsAreCorrectType(channels)) throw createError(TypeError, 'ChannelNotAString');

	const subscription = {callback, filter};
	_subscriptionsAction(subscriptions, channels, 'add', subscription);
	return ()=>_subscriptionsAction(subscriptions, channels, 'delete', subscription);
}

function _publish(subscriptions, channels, message) {
	const callbacks = new Set();

	subscriptions
		.forEach((subscription, subscriptionChannel)=>{
			channels.filter(channel=>{
				if (isRegExp(subscriptionChannel))  return subscriptionChannel.test(channel);
				return (subscriptionChannel === channel)
			}).forEach(subscription=>{
				callbacks.add(subscription.callback);
			});
		});

	callbacks.forEach(callback=>callback(message));

	return !!callbacks.size;
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
	 * Subscribe to information published on a given channel(s) path with optional filtering.
	 *
	 * @public
	 * @param {string|Array|Set} channel		Channel(s) to subscribe to (including glob-style patterns).
	 * @param {Object} [filter]					Filter to filter-out messages that are not wanted.
	 * @param {Function} callback				Callback for caught messages.
	 * @returns {Function}						Unsubscribe function.
	 */
	subscribe(channel, filter, callback) {
		return _subscribe(
			Private.get(this, 'channels', Map),
			makeArray(channel),
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
		const channels = makeArray(channel);
		if (!allChannelsAreCorrectType(channels)) throw createError(TypeError, 'ChannelNotAString');
		return _publish(
			Private.get(this, 'channels', Map),
			uniqueChannels(channels),
			message
		);
	}
}

module.exports = PubSub;
