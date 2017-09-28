(function() {
	"use strict";

	const isNode = (()=>{
		try {
			return (module && module.exports);
		} catch (err){
			return false;
		}
	})();

	const {isFunction} = isNode?require("./util"):window.topic;

	const errors = {
		'CallbackNotFunction': ()=>`Expected callback to be a function.`,
		'ChannelNotAString': ()=>`Expected channel to be a string or regular-expression.`,
		'FilterNotAnObject': ()=>`Expected filter to be an object.`
	};

	function createError(error, errorId, ...params) {
		if (errors[errorId]) {
			if (isFunction(errors[errorId])) return new error(errors[errorId](...params));
			return new error(errors[errorId]);
		}
		return new error(errorId);
	}

	function init() {
		const exports = createError;

		if (isNode) {
			module.exports = exports;
		} else {
			window.bmf = topic || {};
			Object.assign(window.topic, {exports});
		}
	}

	init();
})();