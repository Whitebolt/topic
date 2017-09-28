(function() {
	"use strict";

	const isNode = (()=>{
		try {
			return (module && module.exports);
		} catch (err){
			return false;
		}
	})();

	const $private = new WeakMap();

	function hasConstruct(collection, item, constructor, ...params) {
		if (constructor) {
			if (collection.has && !collection.has(item)) {
				if (collection.set) return collection.set(item, new constructor(...params));
				if (collection.add) return collection.add(new constructor(...params));
			} else if(Array.isArray(collection) && !collection.includes(item)) {
				collection.push(new constructor(...params));
			} else if (!getAllPropertyNames(collection).has(item)) {
				collection[item] = new constructor(...params);
			}
		}
	}

	class Private {
		static get(parent, property, constructor, ...params) {
			hasConstruct($private, parent, Map);
			hasConstruct($private.get(parent), property, constructor, ...params);
			return $private.get(parent).get(property);
		}

		static set(parent, property, value) {
			hasConstruct($private, parent, Map);
			return $private.get(parent).set(property, value);
		}
	}

	function init() {
		const exports = Private;

		if (isNode) {
			module.exports = exports;
		} else {
			window.topic = window.topic || {};
			Object.assign(window.topic, {exports});
		}
	}

	init();
})();