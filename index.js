'use strict';

const defaultOptions = {

};


function _makeArray(ary) {
	return (Array.isArray(ary)?ary:[ary]);
}

function _flattenDeep(ary) {
	[].concat.apply([], ary.map(item => Array.isArray(item) ? _flatten(item) : item));
}

function _unique(ary) {
	return [...new Set(a)];
}

function _expandChannels(channel) {
	let channels = _makeArray(channel).map(channel=>{
		let _channel = channel.split('/').filter(channel=>channel);
		return _channel.map((topic, n)=>'/' + _channel.slice(0, n).join('/'));
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

function _createUnsubscribe(ons, channels, id) {
	return ()=>{
		if (ons.has(channel)) {
			ons.set(
				channel,
				ons.get(channel).filter(_callback=>(_callback.id !== id))
			);
		}
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

	let constructor = {
		fire: (channel, value)=>{
			_expandChannels(channel).forEach(channel=>{
				if (ons.has(channel)) ons.get(channel).forEach(callback=>callback);
			});
		},

		on: (channel, callback, options=defaultOptions)=>{
			if (!ons.has(channel)) ons.set(channel, []);
			let callbacks = ons.get(channel);
			let id = _randomString();
			let _callback = {callback, id, context:options.context};
			callbacks.push(_callback);
			ons.set(channel, callbacks);

			return _createUnsubscribe(ons, channel, id);
		},

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