(function() {
	"use strict";

	const isNode = (()=>{
		try {
			return (module && module.exports);
		} catch (err){
			return false;
		}
	})();

	class AdvancedMap extends Map {
		constructor(...params) {
			super(...params);
		}

		map(callback, context=this) {
			const _callback = callback.bind(context);
			const results = new AdvancedMap();
			super.forEach((...params)=>{
				const [resultKey, resultValue] = _callback(...params);
				results.set(resultKey, resultValue);
			});

			return results;
		}

		filter(callback, context=this) {
			const _callback = callback.bind(context);
			const results = new AdvancedMap();
			super.forEach((...params)=>{
				if (_callback(...params)) results.set(params[1], params[0]);
			});

			return results;
		}
	}

	function init() {
		const exports = AdvancedMap;

		if (isNode) {
			module.exports = exports;
		} else {
			window.topic = window.topic || {};
			Object.assign(window.topic, {Map:AdvancedMap});
		}
	}

	init();
})();