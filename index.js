//removeIf(browser)
'use strict';

const sift = require('sift');
const Private = require("./lib/Private");
const {makeArray, isString, isFunction, isObject, isRegExp, lopper} = require("./lib/util");
const createError = require("./lib/errors");
//endRemoveIf(browser)

/**
 * Apply a given action on a given set, against a given channel with the given subscription.
 *
 * @param {Set} subscriptions				The subscriptions to work on.
 * @param {string} channel					The channel to apply this with.
 * @param {string} action					The action to do.
 * @param {object} subscription				The subscription object to apply.
 */
function _subscriptionAction(subscriptions, channel, action, subscription) {
	if (!subscriptions.has(channel)) subscriptions.set(channel, new Set());
	subscriptions.get(channel)[action](subscription);
}

/**
 * Perform a give action on all on the channels supplied using the subscription value supplied.  This is basically, a
 * way of performing the same action on a sets (eg. add or delete).
 *
 * @private
 * @param {Set} subscriptions				The subscriptions to work on.
 * @param {Array.<string|RegExp>} channels	The channels to apply this with.
 * @param {string} action					The action to do.
 * @param {object} subscription				The subscription object to apply.
 */
function _subscriptionsAction(subscriptions, channels, action, subscription) {
	channels.forEach(channel=>_subscriptionAction(subscriptions, channel, action, subscription));
}

/**
 * Test an array of channels returning true if all channels are correct type and format.  Returns false if any of the
 * channels fail the criteria.
 *
 * @private
 * @param {Array<string|RegExp>} channels	Channels to test.
 * @param {boolean} allowRegExp				Do we allow regular expressions for channels?
 * @returns {boolean}						Did they all pass?
 */
function _allChannelsAreCorrectType(channels, allowRegExp=true) {
	return (channels.filter(channel=>
		(isString(channel) ? (channel.charAt(0) === '/') : (allowRegExp?isRegExp(channel):false))
	).length === channels.length);
}

/**
 * Generator for all ancestor channels of a given array of channels.
 *
 * @private
 * @generator
 * @param {Array.<string>} channels		Channels to expand.
 * @yields {string}						Channel.
 */
function* _allAncestorChannels(channels) {
	const loppers = channels.map(channel=>lopper(channel));

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

/**
 * Get an array of unique ancestor channels from array of channels.
 *
 * @private
 * @param {Array.<string>} channels		Channels array.
 * @returns {Array.<string>}			All calculated channels.
 */
function _uniqueChannels(channels) {
	const uniqueChannels = new Set();

	const lopper = _allAncestorChannels(channels);
	for(let channel of lopper) uniqueChannels.add(channel);

	return Array.from(uniqueChannels);
}

/**
 * Take a channel string and trim any trailing slashes or empty channel parts.
 *
 * @private
 * @param {sgtring} channel		Thr channel to trim.
 * @returns {string}			The trimmed channel.
 */
function _removingTrailingSlash(channel) {
	return (
		(isString(channel) && (channel.charAt(0) === '/')) ?
			'/'+channel.split('/').filter(part=>(part.trim() !== '')).join('/'):
			channel
	);
}

/**
 * Subscribe to the given channels with the supplied listener and filter. Will use the supplied listener lookup map to
 * set listeners.
 *
 * @private
 * @param {Map} listenerLookup										The listener lookup map.
 * @param {Array.<string|RegExp>|Set.<string|RegExp>} channels		The channels to subscribe to.
 * @param {Object} filter											The sift filter to use.
 * @param {Function} listener										The listener to fire when messages received.
 * @returns {Function}												Unsubscribe function.
 */
function _subscribe(listenerLookup, channels, filter, listener) {
	if (!isFunction(listener)) throw createError(TypeError, 'CallbackNotFunction');
	if (!isObject(filter)) throw createError(TypeError, 'FilterNotAnObject');
	if (!_allChannelsAreCorrectType(channels)) throw createError(TypeError, 'ChannelNotAString');

	const subscription = {listener, filter};
	_subscriptionsAction(listenerLookup, channels, 'add', subscription);
	return ()=>_subscriptionsAction(listenerLookup, channels, 'delete', subscription);
}

/**
 * Send a given message to listeners in supplied Set.
 *
 * @private
 * @param {Set.<function>} listeners		Listeners to send messages to.
 * @param {*} message						Message to send.
 * @param {Array.<string>} channels			Channels we are publishing / broadcasting against.
 * @returns {boolean}						Did any listeners receive?
 */
function _messageListeners(listeners, message, channels) {
	listeners.forEach(listener=>listener(
		new Event(message, Object.freeze(channels))
	));

	return !!listeners.size;
}

/**
 * Add listeners to a set based on whether the given message passes the subscription filter.
 *
 * @private
 * @param {Set} listeners		The listeners to filter.
 * @param {*} message			The message to test against.
 * @param {Set} filterSet		The set to add filtered listeners to.
 */
function _filterListeners(listeners, message, filterSet) {
	listeners.forEach(subscription=>{
		if (sift(subscription.filter, [message]).length) filterSet.add(subscription.listener);
	})
}

/**
 * Generator that perform filtered matching from a given lookup of listeners. Run a test function against each channel
 * and yield listeners for each that passes.
 *
 * @private
 * @generator
 * @param {Map} listenerLookup					Channel lookup to cycle through running channel tests against.
 * @param {Array.<string|RegExp>} channels		Channels.
 * @param {function} channelTest				Channel test function.
 * @yields {Set}								Listeners from matching channel.
 */
function* _channelMatcher(listenerLookup, channels, channelTest) {
	for (let [listenerChannel, listeners] of listenerLookup) {
		const filteredChannels = channels.filter(channel=>channelTest(listenerChannel, channel));
		if (filteredChannels.length) yield listeners;
	}
}

/**
 * Generator for obtaining listeners for given channels.
 *
 * @private
 * @generator
 * @param {Map} listenerLookup					Lookup to test against.
 * @param {Array.<string|RegExp>} channels		Channels to look for.
 * @yield {Set}									Listeners found.
 */
function* _inChannelsLookup(listenerLookup, channels) {
	for (let n=0; n<channels.length; n++) {
		if (listenerLookup.has(channels[n])) yield listenerLookup.get(channels[n]);
	}
}

/**
 * Publish a message to the given listeners on the given channels.
 *
 * @param {Map} listenerLookup			The listener lookup to use.
 * @param {Array.<string>} channels		The channels to publish on.
 * @param {*} message					The publish message.
 * @returns {boolean}					Did any listeners receive the message.
 */
function _publish(listenerLookup, channels, message) {
	const publishTo = new Set();
	const matcher1 = _channelMatcher(listenerLookup, channels, (listenerChannel, channel)=>{
		if (isRegExp(listenerChannel)) return listenerChannel.test(channel);
	});
	const matcher2 = _inChannelsLookup(listenerLookup, channels);

	for(const listeners of [...matcher1, ...matcher2]) _filterListeners(listeners, message, publishTo);

	return _messageListeners(publishTo, message, channels);
}

/**
 * Broadcast a message to the given listeners on the given channels.
 *
 * @param {Map} listenerLookup			The listener lookup to use.
 * @param {Array.<string>} channels		The channels to broadcast on.
 * @param {*} message					The broadcast message.
 * @returns {boolean}					Did any listeners receive the message.
 */
function _broadcast(listenerLookup, channels, message) {
	const broadcastTo = new Set();
	const matcher = _channelMatcher(listenerLookup, channels, (listenerChannel, channel)=>{
		if (isRegExp(listenerChannel)) return false;
		return (listenerChannel.substr(0, channel.length) === channel);
	});

	for (const listeners of matcher) _filterListeners(listeners, message, broadcastTo);

	return _messageListeners(broadcastTo, message, channels);
}

/**
 * Event class, this is the class that is passed to listeners, it contains all the given data and other event style
 * information that might be useful.  Each listener get's it's own instance of the class.
 *
 * @class
 */
class Event {
	/**
	 * Create a new event instance.
	 *
	 * @method
	 * @param {*} message					The message being published/broadcast.
	 * @param {Array.<string>} target		The target channels being published/broadcast to.
	 */
	constructor(message, target) {
		Private.set(this, 'data', message);
		Private.set(this, 'target', target);
	}

	/**
	 * The message data.
	 *
	 * @public
	 * @property {*} {}
	 * @returns {*}
	 */
	get data() {
		return Private.get(this, 'data');
	}

	/**
	 * The original channel this was published/broadcast to.
	 *
	 * @public
	 * @property {Array} []
	 * @returns {string}
	 */
	get target() {
		return Private.get(this, 'target');
	}
}


/**
 * Publish and Subscription class.
 *
 * @public
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
	 * @method
	 * @param {string|RegExp|Array.<string|RegExp>|Set.<string|RegExp>} channel		Channel(s) to subscribe to
	 * 																				(including glob-style patterns).
	 * @param {Object} [filter]														Filter to filter-out messages that
	 * 																				are not wanted.
	 * @param {Function} listener													Listener for caught messages.
	 * @returns {Function}															Unsubscribe function.
	 */
	subscribe(channel, filter, listener) {
		return _subscribe(
			Private.get(this, 'channels', Map),
			makeArray(channel).map(channel=>_removingTrailingSlash(channel)),
			listener?filter:{},
			listener?listener:filter
		);
	}

	/**
	 * Publish a message to the given channel(s). Publishing causes a message to be read on given channel and all
	 * parent channels.
	 *
	 * @public
	 * @method
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
	 * @method
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

try {
	if (window) {
		if (window.jQuery || window.$) {
			const $ = window.jQuery || window.$;
			const pubsubs = new Map();

			$.pubsub = function(name, ...params) {
				if (!pubsubs.has(name)) pubsubs.set(name, new PubSub(...params));
				return pubsubs.get(name);
			};
		}

		if (window.angular) {
			const pubsub = new PubSub();
			window.angular.module("TopSubscribe", []).factory("pubsub", pubsub);
		}
	}
} catch(err) {

}

//removeIf(browser)
module.exports = PubSub;
//endRemoveIf(browser)
