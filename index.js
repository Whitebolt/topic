'use strict';

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
