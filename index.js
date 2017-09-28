'use strict';

const isNode = (()=>{
	try {
		return (module && module.exports);
	} catch (err){
		return false;
	}
})();

const Private = isNode?require("./lib/Private"):window.topic.Private;
const Map = isNode?require("./lib/Map"):window.topic.Map;
const {makeArray, isString, isFunction, isObject, isRegExp, lopGen} = isNode?require("./lib/util"):window.topic;
const globToRegExp = require("glob2regexp");
const cache = new Map();

function _channelAction(channels, channel, action, subscription) {
	const _channel = channel.source;
	cache.set(_channel, channel);
	if (!channels.has(_channel)) channels.set(_channel, new Set());
	channels.get(_channel)[action](subscription);
}

function _channelsAction(channels, channel, action, subscription) {
	channel.forEach(channel=>_channelAction(channels, channel, action, subscription));
}

function _subscribe(channels, channel, filter, callback) {
	if (!isFunction(callback)) throw new TypeError(`Expected subscription callback to be a function.`);
	if (!isObject(filter)) throw new TypeError(`Expected subscription filter to be an object.`);
	if (channel.filter(channel=>!isString(channel)).length) throw new TypeError(`Expected subscription channel to be a string.`);

	const [subscription, regExpChannels] = [{callback, filter}, getRegExpChannels(channel)];
	_channelsAction(channels, regExpChannels, 'add', subscription);
	return ()=>_channelsAction(channels, regExpChannels, 'delete', subscription);
}

function getRegExpChannels(channels) {
	return channels.map(channel=>(isRegExp(channel)?channel:globToRegExp(channel)));
}

function _publish(channels, channel, message) {
	if (channel.filter(channel=>!isString(channel)).length) throw new TypeError(`Expected subscription channel to be a string.`);

	const callbacks = new Set();

	channels
		.map((callbacks, channelSource)=>[cache.get(channelSource).test(channel), callbacks])
		.filter(item=>item)
		.forEach((subscriptions, channel)=>{
			callbacks.add(subscriptions.callback)
		});

	callbacks.forEach(callback=>callback(message));

	return !!callbacks.size;
}

function uniqueChannels(channels) {
	const uniqueChannels = new Set();
	channels.forEach(channel=>{
		const lopper = lopGen(channel);
		for(let channel of lopper()) uniqueChannels.add(channel);
	});
	return Array.from(uniqueChannels);
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
		const _channel = makeArray(channel);
		if (_channel.filter(channel=>!isString(channel)).length) throw new TypeError(`Expected subscription channel to be a string.`);

		return _publish(
			Private.get(this, 'channels', Map),
			uniqueChannels(_channel),
			message
		);
	}
}

module.exports = PubSub;
