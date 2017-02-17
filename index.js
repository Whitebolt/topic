'use strict';

const xSlashRegExpChars = /[|\\{}()[\]^$+?.]/g;
const _xConvertChannel1 = [
	{search: /\/\*\//g, replace:'/[^/]*?/'},
	{search: /\/\*\*\//g, replace:'/.*/'},
	{search: /\/\*\*$/, replace:'/.*'},
	{search: /\/\*$/, replace:'/[^/]*?$'}
];
const _xConvertChannel2 = [
	{search: /\/\*\//g, replace:'/[^/]*?/'},
	{search: /\/\*\*\//g, replace:'/.*/'},
	{search: /\/\*$/, replace:'\/.+'}
];
const rndChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');


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
 * @private
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
 * Generate a random string of specified length.
 *
 * @private
 * @param {integer} [length=32] The length of string to return.
 * @returns {string}            The random string.
 */
function _randomString(length=32) {
	return [...Array(length)].map(()=>
		rndChars[Math.floor(Math.random() * rndChars.length)]
	).join('');
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
	_xConvertChannel1.forEach(converter=>{
		pattern = pattern.replace(converter.search, converter.replace)
	});

	return new RegExp(('^'+pattern+'.*$').replace('.*.*','.*'));
}

function _filterUniqueCallbacks(callbacks) {
	let ids = new Map();
	return callbacks.filter(callback=>{
		if (!ids.has(callback.id)) {
			ids.set(callback.id, true);
			return true;
		}
	});
}

function _filterChannels(publishChannel, ons) {
	let callbacks = [];

	for (let channel of ons.keys()) {
		ons.get(channel).forEach(channel=>{
			//console.log(channel.matcher.test(publishChannel), channel.matcher, publishChannel);
			if (channel.matcher.test(publishChannel)) callbacks.push(channel);
		});
	}

	return _filterUniqueCallbacks(_flattenDeep(callbacks));
}

function _getBroadcastMatcher(broadcastChannel) {
	let matcher = _regExpEscape(broadcastChannel);
	_xConvertChannel2.forEach(converter=>{
		matcher = matcher.replace(converter.search, converter.replace)
	});

	return new RegExp(matcher);
}

function _filterChannelsBroadcast(broadcastChannel, ons) {
	let callbacks = [];

	let matcher = _getBroadcastMatcher(broadcastChannel);

	for (let channel of ons.keys()) {
		if (matcher.test(channel)) {
			ons.get(channel).forEach(channel=> callbacks.push(channel));
		}
	}

	return _filterUniqueCallbacks(_flattenDeep(callbacks));
}

function _getCallbacks(ons, channel) {
	if (!ons.has(channel)) ons.set(channel, []);
	return ons.get(channel);
}

function _createCallbackObject(channel, callback, options) {
	let id = _randomString();

	return {
		callback,
		id,
		matcher:_channelMatcherToRegExp(channel),
		context:options.context
	};
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

	function _subscribe(channel, callback, options) {
		let callbacks = _getCallbacks(ons, channel);
		let _callback = _createCallbackObject(channel, callback, options);
		callbacks.push(_callback);
		ons.set(channel, callbacks);
		return _createUnsubscribe(ons, channel, _callback.id);
	}

	let constructor = {
		/**
		 * Publish data to given channel, firing any subscriptions.
		 *
		 * @public
		 * @memberof PubSub
		 * @instance
		 * @param {string|Array} channel	Channel(s) to publish to.  If an
		 * 									array then publish to more than one
		 * 									channel.
		 * @param {*} data					Data to publish.
		 */
		publish: (channel, data)=>{
			_makeArray(channel).forEach(channel=>{
				_filterChannels(channel, ons).forEach(callback=>callback.callback(data));
			});
		},

		/**
		 * Broadcast data on a given channel, firing any subscriptions.
		 * A broadcast causes all child channels to receive the message as well.
		 * This is the opposite to publish where parents receive from children
		 * rather than children from parents.
		 *
		 * @public
		 * @memberof PubSub
		 * @instance
		 * @param {string|Array} channel	Channel(s) to broadcast on.  If an
		 * 									array then broadcast to more than
		 * 									one channel.
		 * @param {*} data					Data to broadcast.
		 */
		broadcast: (channel, data)=>{
			_makeArray(channel).forEach(channel=>{
				_filterChannelsBroadcast(channel, ons).forEach(callback=>callback.callback(data));
			});
		},

		/**
		 * Subscribe to a channel or if an array is supplied more than one
		 * channel.  Fire callback when anything is published on subscribed
		 * channels subscribed to.
		 *
		 * @public
		 * @memberof PubSub
		 * @instance
		 * @param {string|Array} channel				Channel(s) to
		 * 												subscribe to.
		 * @param {Function} callback					Callback to fire when
		 * 												channel is published to.
		 * @param {Object} [options=defaultOptions]		Subscription options.
		 */
		subscribe: (channel, callback, options=defaultOptions)=>{
			if (!Array.isArray(channel)) return _subscribe(channel, callback, options);
			let unsubscribes = channel.map(channel=>constructor.subscribe(channel, callback, options));
			return ()=>unsubscribes.forEach(unsubscribe=>unsubscribe());
		},

		/**
		 * Subscribe just once to the given channel(s).  After first callback,
		 * unsubscribe from channel(s).
		 *
		 * @public
		 * @memberof PubSub
		 * @instance
		 * @param {string|Array} channel				Channel(s) to
		 * 												subscribe to.
		 * @param {Function} callback					Callback to fire when
		 * 												channel is published to.
		 * @param {Object} [options=defaultOptions]		Subscription options.
		 */
		once: (channel, callback, options=defaultOptions)=>{
			let unsubscribe = constructor.subscribe(channel, ()=>{
				unsubscribe();
				callback();
			}, options);
			return unsubscribe;
		}
	};

	return constructor;
};

module.exports = PubSub;