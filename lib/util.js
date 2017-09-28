(function() {
	"use strict";

	const isNode = (()=>{
		try {
			return (module && module.exports);
		} catch (err){
			return false;
		}
	})();

	function makeArray(value) {
		if (value instanceof Set) return [...value];
		return (Array.isArray(value)?value:[value]);
	}

	function isString(value) {
		return (typeof value === 'string');
	}

	function isFunction(value) {
		return !!(value && value.constructor && value.call && value.apply);
	}

	function isObject(value) {
		return ((Object.prototype.toString.call(value) === '[object Object]') && !(value === null));
	}

	function isRegExp(value) {
		return (value instanceof RegExp);
	}

	function lop(text, seperator='/') {
		const parts = text.split(seperator);
		parts.pop();
		return parts.join(seperator)
	}

	function lopGen(text, seperator='/') {
		let _text = text;
		let last = _text;

		return function*() {
			while (_text.length) {
				last = _text;
				yield _text;
				_text = lop(_text, seperator='/');
			}
			if (last !== '/') yield '/';
		};
	}

	function getAllPropertyNames(obj) {
		const all = new Set();

		do {
			Object.getOwnPropertyNames(obj).forEach(property=>all.add(property));
		} while (obj = Object.getPrototypeOf(obj));

		return all;
	}

	function init() {
		const exports = {makeArray, isString, isFunction, isObject, isRegExp, getAllPropertyNames, lop, lopGen};

		if (isNode) {
			module.exports = exports;
		} else {
			window.topic = window.topic || {};
			Object.assign(window.topic, exports);
		}
	}

	init();
})();