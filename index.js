'use strict';

const xSlashRegExpChars = /[|\\{}()[\]^$+?.]/g;
const xConvertChannel = [
	{search: new RegExp('\/\*\/'), replace:'\/[^\/]*?\/'},
	{search: new RegExp('\/\*$'), replace:'\/.*$'},
	{search: new RegExp('\/\*\*\/'), replace:'\/.*\/'}
];


const defaultOptions = {

};

/**
 * Convert a non-array to an array using the formula: if =undefined then make
 * empty array, otherwise create new array making the first item the
 * supplied value.
 *
 * @private
 * @param {*} ary     Value to convert.
 * @returns {Array}   Converted value.
 */
function _makeArrayConvertFunction(ary) {
	return ((ary===undefined)?[]:[ary]);
}

/**
 * Always return an array.  If the provided parameter is an array then return it
 * as-is.  If provided param is not an array return param as first item of an
 * array. If a convertFunction is supplied the default non-array to array
 * conversion can be overridden.
 *
 * Function is useful when you always need a value to be array to use array
 * functions (such as map or forEach) on it but cannot guarantee it will be.
 *
 * Will convert 'undefined' to an empty array.
 *
 * @param {*} ary                                                   Item to
 * 																	return or
 * 																	convert to
 * 																	an array.
 * @param {function} [convertFunction=_makeArrayConvertFunction]    Function
 * 																	used to
 * 																	convert to
 * 																	an array
 * 																	if not
 *                                                                  already one.
 * @returns {Array}                                                 New array or
 * 																	supplied
 * 																	parameter
 * 																	returned.
 */
function _makeArray(ary, convertFunction=_makeArrayConvertFunction) {
	return (Array.isArray(ary) ? ary : convertFunction(ary));
}

/**
 * Flatten an array of arrays to a one-dimensional array.
 *
 * @private
 * @param {Array} ary		Array to flatten.
 * @returns {Array}			Flattened array.
 */
function _flattenDeep(ary) {
	return [].concat.apply([], ary.map(item => Array.isArray(item) ? _flatten(item) : item));
}

/**
 * Filter duplicated out of the given array.
 *
 * @private
 * @param {Array} ary		Array to filter duplicates from.
 * @returns {Array}			Filtered array.
 */
function _unique(ary) {
	return [...new Set(ary)];
}

/**
 * Expand the given channel(s) string to array of all possible channels.
 *
 * @private
 * @param {string|Array} channel	Channel(s) string to expand.
 * @returns {Array}					List of channels.
 */
function _expandChannels(channel) {
	let channels = _makeArray(channel).map((channel, n, channels)=>{
		let _channel = channel.split('/').filter(channel=>channel);
		return _channel.map((topic, n)=>'/'+_channel.slice(0, n).join('/')+((n>=(channels.length-1))?'':'/*'));
	});

	return _unique(_flattenDeep(channels));
}

/**
 * Generate a random string of specified length.
 *
 * @public
 * @param {integer} [length=32] The length of string to return.
 * @returns {string}            The random string.
 */
function _randomString(length=32) {
	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

	if (! length) {
		length = Math.floor(Math.random() * chars.length);
	}

	var str = '';
	for (var i = 0; i < length; i++) {
		str += chars[Math.floor(Math.random() * chars.length)];
	}
	return str;
}

/**
 * Create an unsubscribe function for the given channel and id.
 *
 * @private
 * @param {Map} ons				PubSub subscriptions map.
 * @param {string} channel		Channel to unsubscribe from.
 * @param {string} id			Id of callback to remove.
 * @returns {Function}			The unsubscribe function.
 */
function _createUnsubscribe(ons, channel, id) {
	return ()=>{
		if (ons.has(channel)) {
			ons.set(
				channel,
				ons.get(channel).filter(_callback=>(_callback.id !== id))
			);
		}
	};
}

function _regExpEscape(txt) {
	return txt.replace(xSlashRegExpChars, '\\$&');
}

function _channelMatcherToRegExp(matcher) {
	let pattern = _regExpEscape(matcher);
	xConvertChannel.forEach(converter=>pattern.replace(converter.search, converter.replace));
	return pattern;
}

function _filterChannels(broadcastChannel, ons) {
	let callbacks = [];
	let ids = new Map();

	for (let channel of ons.keys()) {
		let _channel = ons.get(channel);
		if (_channel.matcher.test(broadcastChannel)) {
			callbacks = callbacks.concat(_channel);
		}
	}

	return callbacks.filter(callback=>{
		if (!ids.has(callback.id)) {
			ids.set(callback.id, true);
			return true;
		}
	});
}

/**
 * Create a new PubSub instance.
 *
 * @class
 * @public
 * @returns {PubSub}		New PubSub instance.
 */
function PubSub() {
	const ons = new Map();

	let constructor = {
		/**
		 * Publish data to given channel, firing any subscriptions.
		 *
		 * @public
		 * @param {string|Array} channel	Channel(s) to publish to.  If an
		 * 									array then publish to more than one
		 * 									channel.
		 * @param {*} data					Data to publish.
		 */
		publish: (channel, data)=>{
			_expandChannels(channel).forEach(channel=>{
				_filterChannels(channel, ons).forEach(callback=>callback.callback(data));
			});
		},

		/**
		 * Subscribe to a channel or if an array is supplied more than one
		 * channel.  Fire callback when anything is published on subscribed
		 * channels subscribed to.
		 *
		 * @param {string|Array} channel				Channel(s) to
		 * 												subscribe to.
		 * @param {Function} callback					Callback to fire when
		 * 												channel is published to.
		 * @param {Object} [options=defaultOptions]		Subscription options.
		 */
		subscribe: (channel, callback, options=defaultOptions)=>{
			if (isArray(channel)) {
				let unsubscribes = channel.map(channel=>constructor.subscribe(channel, callback, options));
				return ()=>unsubscribes.forEach(unsubscribe=>unsubscribe());
			}

			if (!ons.has(channel)) ons.set(channel, []);
			let callbacks = ons.get(channel);
			let id = _randomString();
			let _callback = {
				callback,
				id,
				matcher: _channelMatcherToRegExp(channel),
				context:options.context
			};
			callbacks.push(_callback);
			ons.set(channel, callbacks);

			return _createUnsubscribe(ons, channel, id);
		},

		/**
		 * Subscribe just once to the given channel(s).  After first callback,
		 * unsubscribe from channel(s).
		 *
		 * @param {string|Array} channel				Channel(s) to
		 * 												subscribe to.
		 * @param {Function} callback					Callback to fire when
		 * 												channel is published to.
		 * @param {Object} [options=defaultOptions]		Subscription options.
		 */
		once: (channel, callback, options=defaultOptions)=>{
			let unsubscribe = constructor.on(channel, ()=>{
				unsubscribe();
				callback();
			}, options);
		}
	};

	return constructor;
}

module.exports = PubSub;