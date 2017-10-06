//removeIf(browser)
'use strict';

//removeIf(node)
const Private = require("./Private");
//endRemoveIf(node)
//endRemoveIf(browser)

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
		Private.set(this, 'broadcast', !!options.broadcast);
		Private.set(this, 'publish', !!options.publish);
		Private.set(this, 'timestamp', (new Date()).getTime());
		if (message.sourceTimestamp || message.timestamp) {
			Private.set(this, 'sourceTimestamp', message.sourceTimestamp || message.timestamp);
		}
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
}

//removeIf(browser)
module.exports = Message;
//endRemoveIf(browser)