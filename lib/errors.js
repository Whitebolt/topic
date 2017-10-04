//removeIf(browser)
'use strict';

const {isFunction} = require("./util");
//endRemoveIf(browser)

const errors = {
	'CallbackNotFunction': ()=>`Expected callback to be a function.`,
	'ChannelNotAString': ()=>`Expected channel to be a channel string (starting with a slash) or regular-expression.`,
	'FilterNotAnObject': ()=>`Expected filter to be an object.`
};

/**
 * Create an error object against the given id.  If id supplied then look it up in errors object.
 *
 * @public
 * @param {Object} errorConstructor			Error constructor object.
 * @param {string|function|*} errorId		The error id to lookup and use text of.  If id is not found assume id is
 * 											the text to apply to the error. If id is function run function with
 * 										 	supplied parameters to get error constructor params.
 * @param params							Parameters to run through the function returned by error id lookup.
 * @returns {Error}							New error instance that can be thrown.
 */
function createError(errorConstructor, errorId, ...params) {
	if (errors[errorId]) {
		if (isFunction(errors[errorId])) return new errorConstructor(errors[errorId](...params));
		return new errorConstructor(errors[errorId]);
	}
	return new errorConstructor(errorId);
}

//removeIf(browser)
module.exports = createError;
//endRemoveIf(browser)
