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

	function init() {
		const exports = {makeArray};

		if (isNode) {
			module.exports = exports;
		} else {
			window.topic = window.topic || {};
			Object.assign(window.topic, exports);
		}
	}

	init();
})();