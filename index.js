'use strict';

const isNode = (()=>{
	try {
		return (module && module.exports);
	} catch (err){
		return false;
	}
})();

const Private = isNode?require("./lib/Private"):window.topic.Private;
const {makeArray, isString, isFunction, isObject} = isNode?require("./lib/util"):window.topic;

function _channelAction(channels, channel, action, subscription) {
	if (!channels.has(channel)) channels.set(channel, new Set());
	channels.get(channel)[action](subscription);
}

function _subscribe(channels, channel, filter, callback) {
	if (!isFunction(callback)) throw new TypeError(`Expected subscription callback to be a function.`);
	if (!isObject(filter)) throw new TypeError(`Expected subscription filter to be an object.`);

	const subscription = {callback, filter};

	channel.forEach(channel=>{
		console.log(channel);
		if (!isString(channel)) throw new TypeError(`Expected subscription channel to be a string.`);
		_channelAction(channels, channel, 'add', subscription)
	});

	return ()=>{
		channel.forEach(channel=>_channelAction(channels, channel, 'delete', subscription));
	};
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

	}

	/**
	 * Broadcast a message to the given channel(s). Broadcasting causes a message to be read on a given channel and all
	 * child and descendant channels.
	 *
	 * @public
	 * @param {string|Array|set} channel		Channel(s) to publish on (including glob-style patterns).
	 * @param {*} message						Message to publish.
	 * @returns {boolean}						Did the message publish?
	 */
	broadcast() {

	}
}

module.exports = PubSub;
