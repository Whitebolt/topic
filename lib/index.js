//removeIf(browser)
//removeIf(node)
'use strict';
//endRemoveIf(node)
const sift = require('sift');
//endRemoveIf(browser)

//removeIf(browser)
//removeIf(node)
const Private = require("./Private");
const Message = require("./Message");
const {makeArray, isString, isFunction, isObject, isRegExp, lopper, clone} = require("./util");
const createError = require("./errors");
//endRemoveIf(node)
//endRemoveIf(browser)

const listenerToChannel = new WeakMap();

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
 * Send a given message to listeners in supplied Set.
 *
 * @private
 * @param {Set.<function>} listeners		Listeners to send messages to.
 * @param {*} message						Message to send.
 * @param {Object} options					Options object used in Message constructor
 * @returns {boolean}						Did any listeners receive?
 */
function _messageListeners(listeners, message, options) {
	listeners.forEach(listener=>{
		listener(new Message(message, Object.assign({}, options, {
			currentTarget:getChannelForListener(listeners, listener)
		})))
	});
	return !!listeners.size;
}

function addToFilterSet(filterSet, listener, channel) {
	if (!filterSet.has(listener)) {
		if (!listenerToChannel.has(filterSet)) listenerToChannel.set(filterSet, new WeakMap());
		listenerToChannel.get(filterSet).set(listener, channel);
		filterSet.add(listener);
	}
}

function getChannelForListener(filterSet, listener) {
	if (listenerToChannel.has(filterSet)) return listenerToChannel.get(filterSet).get(listener);
}

/**
 * Add listeners to a set based on whether the given message passes the subscription filter.
 *
 * @private
 * @param {Set} listeners		The listeners to filter.
 * @param {string} channel		Channel listener isattached to.
 * @param {*} message			The message to test against.
 * @param {Set} filterSet		The set to add filtered listeners to.
 */
function _filterListeners(listeners, channel, message, filterSet) {
	listeners.forEach(subscription=>{
		if (sift(subscription.filter, [message]).length) {
			if (!filterSet.has(subscription.listener)) addToFilterSet(filterSet, subscription.listener, channel);
		}
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
		if (filteredChannels.length) yield [listenerChannel, listeners];
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
		if (listenerLookup.has(channels[n])) yield [channels[n], listenerLookup.get(channels[n])];
	}
}

/**
 * Given a set of channels and a listener lookup map, get the listeners to publish to.
 *
 * @private
 * @param {Map} listenerLookup					The listener lookup map.
 * @param {Array.<string|RegExp>} channels		The channels array.
 * @param {Object} message						The message we are publishing.
 * @returns {Set.<Function>}					The listeners.
 */
function _getPublishTo(listenerLookup, channels, message) {
	const publishTo = new Set();
	const matcher1 = _channelMatcher(listenerLookup, channels, (listenerChannel, channel)=>{
		if (isRegExp(listenerChannel)) return listenerChannel.test(channel);
	});
	const matcher2 = _inChannelsLookup(listenerLookup, channels);

	for(const [listenerChannel, listeners] of [...matcher1, ...matcher2]) _filterListeners(listeners, listenerChannel, message, publishTo);
	return publishTo;
}

/**
 * Given a set of channels and a listener lookup map, get the listeners to broadcast to.
 *
 * @private
 * @param {Map} listenerLookup			The listener lookup map.
 * @param {Array.<string>} channels		The channels array.
 * @param {Object} message				The message we are broadcasting.
 * @returns {Set.<Function>}			The listeners.
 */
function _getBroadcastTo(listenerLookup, channels, message) {
	const broadcastTo = new Set();
	const matcher = _channelMatcher(listenerLookup, channels, (listenerChannel, channel)=>{
		if (isRegExp(listenerChannel)) return false;
		return (listenerChannel.substr(0, channel.length) === channel);
	});

	for (const [listenerChannel, listeners] of matcher) _filterListeners(listeners, listenerChannel, message, broadcastTo);

	return broadcastTo;
}

/**
 * Given a channel, and a listener lookup map unsubscribe all listeners from it.
 *
 * @private
 * @param {Map} listenerLookup			The listener lookup to use.
 * @param {string|RegExp} channel		The channel to unsubscribe listeners from.
 * @returns {boolean}					Did anything unsubscibe?
 */
function _unsubscribeChannel(listenerLookup, channel) {
	let unsubscribed = false;

	if (listenerLookup.has(channel)) {
		listenerLookup.get(channel).clear();
		listenerLookup.delete(channel);
		unsubscribed = true;
	}

	return unsubscribed;
}

/**
 * Given a listener and listener lookup map, unsubscribe the listener on every channel it listens on.
 *
 * @private
 * @param {Map} listenerLookup			The listener lookup to use.
 * @param {Function} listener			The listener to unsubscribe.
 * @returns {boolean}					Did anything unsubscibe?
 */
function _unsubscribeListener(listenerLookup, listener) {
	let unsubscribed = false;

	listenerLookup.forEach(subscriptions=>{
		subscriptions.forEach(subscription=>{
			if (subscription.listener === listener) {
				subscriptions.delete(subscription);
				unsubscribed = true;
			}
		});
	});

	return unsubscribed;
}

/**
 * Get an array of channels corrected with no-trailing slashes from given array, string or regular-expression.
 *
 * @private
 * @param {string|Array|set} channels		Channel(s) to publish on (including RegExp).
 * @returns {Array.<string|RegExp>} 		The channels to publish on.
 */
function _getCorrectedChannelsArray(channels) {
	const correctedChannels = makeArray(channels).map(channel=>_removingTrailingSlash(channel));
	if (!_allChannelsAreCorrectType(correctedChannels, false)) throw createError(TypeError, 'ChannelNotAString');
	return correctedChannels;
}

/**
 * Parse the given message to make ready for publishing / broadcasting via PubSub.
 *
 * @private
 * @param {Message|Object|*} message			The message object to mirror.
 * @param {Array.<Function>} [parsers=[]]		The parsers to use in converting into the correct format.
 * @param {string} [base='']					The base to prepend to channels.
 * @returns {Object}							The parsed message object.
 */
function _mirrorMessageParse(message, parsers=[], base='') {
	let _message = clone(message || {});
	makeArray(parsers).forEach(parser=>{
		_message = parser(_message, base) || _message;
	});

	_message.target = makeArray(_message.target || []);
	_message.target = (_message.target.length ? _message.target : ((base !== '')?['']:[])).map(channel=>{
		if (isString(channel)) return base + channel;
		return channel;
	});

	return _message;
}

function getSourceSubscriber(pubsub, name) {
	const sourceSubscribers = Private.get(pubsub, 'sourceSubscribers', Map);
	const staticSourceSubscribers = Private.get(PubSub, 'sourceSubscribers', Map);
	return sourceSubscribers.get(name) || staticSourceSubscribers.get(name);
}

function _sourceGeneric(emitter, method, channel, params) {
	params.forEach(params=>emitter[method](channel, ...params));
}

function _getOnParams(pubsub, channel, options) {
	return makeArray(channel).map(channel=>{
		return [
			(message, ...params)=>{
				pubsub.mirror(message, options.parsers, options.base)
			}
		];
	});
}

/**
 * Given an subscription method (like PubSub) on an emitter, mirror given events to pubsub instance. The method name is
 * given via options.on.
 *
 * @private
 * @param {PubSub} pubsub				PubSub instance to mirror to.
 * @param {Object} emitter				Emitter to source from.
 * @param {Array|string} channel		Channel(s) to listen on.
 * @param {Object} options				Options used to create mirroring.
 */
function _sourceSubscribe(pubsub, emitter, channel, options) {
	const params = _getOnParams(pubsub, channel, options).map(params=>{
		if (options.filter) params.unshift(options.filter);
		return params;
	});

	_sourceGeneric(emitter, 'subscribe', channel, params);
}

/**
 * Given an addEventListener subscription method (DOM style) on an emitter, mirror given events to pubsub instance.
 * The method name is given via options.on.
 *
 * @private
 * @param {PubSub} pubsub				PubSub instance to mirror to.
 * @param {Object} emitter				Emitter to source from.
 * @param {Array|string} channel		Channel(s) to listen on.
 * @param {Object} options				Options used to create mirroring.
 */
function _sourceAddEventListener(pubsub, emitter, channel, options) {
	const params = _getOnParams(pubsub, channel, options).map(params=>{
		if (options.options) {
			params.push(options.options);
		} else if (options.useCapture) {
			params.push(options.useCapture);
			if (options.wantsUntrusted) params.push(options.wantsUntrusted);
		}
		return params;
	});
	_sourceGeneric(emitter, 'addEventListener', channel, params);
}

/**
 * Given an $on style (Angular like) subscription method on an emitter, mirror given events to pubsub instance. The
 * method name is given via options.on.
 *
 * @private
 * @param {PubSub} pubsub				PubSub instance to mirror to.
 * @param {Object} emitter				Emitter to source from.
 * @param {Array|string} channel		Channel(s) to listen on.
 * @param {Object} options				Options used to create mirroring.
 */
function _source$On(pubsub, emitter, channel, options) {
	_sourceGeneric(
		emitter,
		'$on',
		channel,
		_getOnParams(pubsub, channel, options)
	);
}

/**
 * Given an user-defined subscription method on an emitter, mirror given events to pubsub instance. The method name is
 * given via options.on.
 *
 * @private
 * @param {PubSub} pubsub				PubSub instance to mirror to.
 * @param {Object} emitter				Emitter to source from.
 * @param {Array|string} channel		Channel(s) to listen on.
 * @param {Object} options				Options used to create mirroring.
 */
function _sourceUserDefined(pubsub, emitter, channel, options) {
	const params = _getOnParams(pubsub, channel, options).map(params=>{
		return [
			...makeArray(options.beforeListenerParams),
			...params,
			...makeArray(options.afterListenerParams)
		];
	});

	_sourceGeneric(emitter, options.on, channel, params);
}

/**
 * Given an on style method (jQuery-like) on an emitter, mirror given events to pubsub instance.
 *
 * @private
 * @param {PubSub} pubsub				PubSub instance to mirror to.
 * @param {Object} emitter				Emitter to source from.
 * @param {Array|string} channel		Channel(s) to listen on.
 * @param {Object} options				Options used to create mirroring.
 */
function _sourceOn(pubsub, emitter, channel, options) {
	const params = _getOnParams(pubsub, channel, options).map(params=>{
		if (options.selector) params.unshift(options.selector);
		if (options.data) params.unshift(options.data);
		return params;
	});
	_sourceGeneric(emitter, 'on', channel, params);
}

/**
 * Publish a message to the given listeners on the given channels.
 *
 * @param {Map} listenerLookup					The listener lookup to use.
 * @param {Array.<string|RegExp>} channels		The channels to publish on.
 * @param {*} message							The publish message.
 * @returns {boolean}							Did any listeners receive the message.
 */
function _publish(listenerLookup, channels, message) {
	const publishTo = _getPublishTo(listenerLookup, _uniqueChannels(channels), message);
	return _messageListeners(publishTo, message, {target:channels, publish:true});
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
	const broadcastTo = _getBroadcastTo(listenerLookup, channels, message);
	return _messageListeners(broadcastTo, message, {target:channels, broadcast:true});
}

/**
 * Take an input message of type similar to Message.  Based on it's content broadcast or publish to given
 * PubSub instance.
 *
 * @private
 * @param {Map} listenerLookup			The Pubsub instance.
 * @param {Message|Object} message		Message to mirror.
 * @returns {boolean}					Did anything receive the message?
 */
function _mirror(listenerLookup, message) {
	const channels = _getCorrectedChannelsArray(message.target);

	let mirrored = false;

	if (!message.data) message.data = {};
	if (!message.broadcast && !message.publish) message.publish = true;

	let mirrorTo;
	const options = {target:channels};

	if (message.broadcast === true) {
		mirrorTo = _getBroadcastTo(listenerLookup, channels, message.data);
		options.broadcast = true;
	} else if (message.publish === true) {
		mirrorTo = _getPublishTo(listenerLookup, _uniqueChannels(channels), message.data);
		options.publish = true;
	}
	if (mirrorTo && mirrorTo.size) {
		if (message.timestamp) options.timestamp = message.timestamp;
		mirrored = _messageListeners(mirrorTo, message.data, options) || mirrored;
	}


	return mirrored;
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
 * Unsubscribe the given listener throughout this PubSub instance or if channel(s) given unsubscribe from the given
 * channel(s) through PubSub instance.
 *
 * @private
 * @method
 * @param {Map} listenerLookup										The listener lookup to use.
 * @param {Array.<string|Function|RegExp>} channelsOrListeners		The channel or listener to unsubscribe.
 * @return {boolean}												Did anything unsubscibe?
 */
function _unsubscribe(listenerLookup, channelsOrListeners) {
	let unsubscribed = false;

	channelsOrListeners.forEach(channel=>{
		if (isFunction(channel)) {
			unsubscribed = _unsubscribeListener(listenerLookup, channel) || unsubscribed;
		} else {
			unsubscribed = _unsubscribeChannel(listenerLookup, channel) || unsubscribed;
		}
	});

	return unsubscribed
}

/**
 * Publish and Subscription class.
 *
 * @public
 * @class
 */
class PubSub {
	constructor() {
		const emitterSourceOrder = this.emitterSourceOrder;
		emitterSourceOrder.add({name:'Generic', fromOptions:true, method:'on'});
		emitterSourceOrder.add({name:'jQuery', fromOptions:false, method:'on'});
		emitterSourceOrder.add({name:'Angular', fromOptions:false, method:'$on'});
		emitterSourceOrder.add({name:'PubSub', fromOptions:false, method:'subscribe'});
		emitterSourceOrder.add({name:'DOM', fromOptions:false, method:'addEventListener'});
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
	 * Unsubscribe the given listener throughout this PubSub instance or if channel(s) given unsubscribe from the given
	 * channel(s) through PubSub instance.
	 *
	 * @public
	 * @method
	 * @param {string|Function|RegExp|Array.<string|Function|RegExp>} channel	The channel or listener to unsubscribe.
	 * @return {boolean}														Did anything unsubscibe?
	 */
	unsubscribe(channel) {
		const channels = Private.get(this, 'channels', Map);
		return _unsubscribe(channels, makeArray(channel));
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
		return _publish(
			Private.get(this, 'channels', Map),
			_getCorrectedChannelsArray(channel),
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
		return _broadcast(
			Private.get(this, 'channels', Map),
			_getCorrectedChannelsArray(channel),
			message
		);
	}

	/**
	 * Mirror a message from on pubsub source into this instance.  It expects a message object in a similar format to
	 * the one used in this class.  Messages do not have to be identical but they should have a target, which is the
	 * channels to broadcast/publish to; a data property, which is the message; and either a publish or broadcast
	 * boolean property.
	 *
	 * Parsers can be supplied to parse the message into the correct format. A base maybe supplied if we want to prepend
	 * a new base to each channel.
	 *
	 * @note: Messages are mirrored not republished; original messages are cloned.
	 *
	 * @param {Message|Object|*} message			The message object to mirror.
	 * @param {Array.<Function>} [parsers=[]]		The parsers to use in converting into the correct format.
	 * @param {string} [base='']					The base to prepend to channels.
	 * @returns {boolean}							Did anything receive the message?
	 */
	mirror(message, parsers=[], base='/') {
		return _mirror(
			Private.get(this, 'channels', Map),
			_mirrorMessageParse(message, parsers, base)
		);
	}

	/**
	 * Given a source emitter, mirror given events to this pubsub instance.  This is a convenience method, to easily
	 * mirror events from the DOM, jQuery or Angular.  It covers most use cases and therefore makes it easier to just
	 * plug another emitter into this PubSub class.
	 *
	 * Method can be called with options but without channel.  In this case the default channel of '/' is applied.
	 *
	 * @param {Object} emitter								The source emitter.
	 * @param {string|Array.<string>|*} [channel='/']		The 'channel' to 'subscribe' on the emitter.
	 * @param {Object} [options={}]							Options object for creating the mirror.
	 */
	source(emitter, channel='/', options={}) {
		if (!isString(channel) && !Array.isArray(channel) && !(channel instanceof Set)) {
			if (isObject(options) && !Object.keys(options).length) {
				options = channel;
				channel = '/';
			}
		}

		if (options.type) {
			const sourceMirror = getSourceSubscriber(this, options.type);
			if (sourceMirror) return sourceMirror(this, emitter, channel, options);
		}

		[...this.emitterSourceOrder].every(details=>{
			const method = (details.fromOptions ? options[details.method] : details.method);
			if (emitter[method]) {
				const sourceMirror = getSourceSubscriber(this, details.name);
				if (sourceMirror) {
					sourceMirror(this, emitter, channel, options);
					return false;
				}
			}
			return true;
		});
	}

	addSourceSubscriber(name, method) {
		const sourceSubscribers = Private.get(this, 'sourceSubscribers', Map);
		sourceSubscribers.set(name, method);
	}

	deleteSourceSubscriber(name) {
		const sourceSubscribers = Private.get(this, 'sourceSubscribers', Map);
		sourceSubscribers.delete(name);
	}

	static addSourceSubscriber(name, method) {
		const sourceSubscribers = Private.get(PubSub, 'sourceSubscribers', Map);
		sourceSubscribers.set(name, method);
	}

	static deleteSourceSubscriber(name) {
		const sourceSubscribers = Private.get(PubSub, 'sourceSubscribers', Map);
		sourceSubscribers.delete(name);
	}

	get emitterSourceOrder() {
		return Private.get(this, 'emitterSourceOrder', Set);
	}
}

PubSub.addSourceSubscriber('jQuery', _sourceOn);
PubSub.addSourceSubscriber('Angular', _source$On);
PubSub.addSourceSubscriber('PubSub', _sourceSubscribe);
PubSub.addSourceSubscriber('DOM', _sourceAddEventListener);
PubSub.addSourceSubscriber('Generic', _sourceUserDefined);

//removeIf(browser)
module.exports = PubSub;
//endRemoveIf(browser)
