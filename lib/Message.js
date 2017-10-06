//removeIf(browser)
'use strict';

//removeIf(node)
const Private = require("./Private");
const {makeArray, isRegExp} = require("./util");
//endRemoveIf(node)
//endRemoveIf(browser)

const AT_TARGET = Symbol('Message at target');
const BUBBLING_PHASE = Symbol('Message in bubbling phase');

/**
 * Message class, this is the class that is passed to listeners, it contains all the given data and other event style
 * information that might be useful.  Each listener get's it's own instance of the class.
 *
 * @class
 */
class Message {
	/**
	 * Create a new event instance.
	 *
	 * @method
	 * @param {*} message				The message being published/broadcast.
	 * @param {Object} options			The construction options (including channels).
	 */
	constructor(message, options) {
		Private.set(this, 'data', message);
		Private.set(this, 'target', options.target);
		Private.set(this, 'currentTarget', options.currentTarget);
		if (options.broadcast) Private.set(this, 'broadcast', !!options.broadcast);
		if (options.publish) Private.set(this, 'publish', !!options.publish);
		Private.set(this, 'timestamp', (new Date()).getTime());
		if (message.sourceTimestamp || message.timestamp) {
			Private.set(this, 'sourceTimestamp', message.sourceTimestamp || message.timestamp);
		}

		const atTarget = !!makeArray(options.target).find(channel=>
			(isRegExp(channel) ? channel.test(options.currentTarget) :(channel === options.currentTarget))
		);

		Private.set(this, 'eventPhase', atTarget?Message.AT_TARGET:Message.BUBBLING_PHASE);
	}

	/**
	 * The message data.
	 *
	 * @public
	 * @property {*}
	 */
	get data() {
		return Private.get(this, 'data');
	}

	/**
	 * The original channel this was published/broadcast to.
	 *
	 * @public
	 * @property {Array}
	 */
	get target() {
		return Private.get(this, 'target');
	}

	/**
	 * The channel now receiving the message (might be different due to broadcast and publish bubbling).
	 *
	 * @public
	 * @property {Array}
	 */
	get currentTarget() {
		return Private.get(this, 'currentTarget');
	}

	/**
	 * Is the message a broadcast message?
	 *
	 * @public
	 * @property {boolean}
	 */
	get broadcast() {
		return Private.get(this, 'broadcast');
	}

	/**
	 * Is the message a publish message?.
	 *
	 * @public
	 * @property {boolean}
	 */
	get publish() {
		return Private.get(this, 'publish');
	}

	/**
	 * The timestamp on message creation.
	 *
	 * @public
	 * @property {integer}		Time in milliseconds.
	 */
	get timestamp() {
		return Private.get(this, 'timestamp');
	}

	/**
	 * The timestamp from original message if a mirrored message.
	 *
	 * @public
	 * @property {integer|undefined}		Time in milliseconds or undefined if not available.
	 */
	get sourceTimestamp() {
		return Private.get(this, 'sourceTimestamp');
	}

	/**
	 * The current event phase (bubbling or not).
	 *
	 * @public
	 * @property {Symbol}		The phase value.
	 */
	get eventPhase() {
		return Private.get(this, 'eventPhase');
	}

	static get AT_TARGET() {
		return AT_TARGET;
	}

	static get BUBBLING_PHASE() {
		return BUBBLING_PHASE;
	}
}

//removeIf(browser)
module.exports = Message;
//endRemoveIf(browser)