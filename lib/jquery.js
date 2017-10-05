//removeIf(node)
if (window.jQuery || window.$) {
	const $ = window.jQuery || window.$;
	const lookups = new WeakMap();
	const pubsubs = new Map();
	const names = new WeakMap();

	function weakMapAddSet(weakmap, ref, value) {
		if (!weakmap.has(ref)) weakmap.set(ref, new Set());
		if (value !== undefined) weakmap.get(ref).add(value);
		return weakmap.get(ref);
	}

	$.fn.pubsub = function(name, ...params) {
		if (name) {
			if (!pubsubs.has(name)) pubsubs.set(name, new PubSub(...params));
			weakMapAddSet(names, pubsubs.get(name), name);
			this.each((n, item)=>weakMapAddSet(lookups, item, pubsubs.get(name)));
		}

		function getPubSubs(items) {
			const pubsubs = new Set();
			items.each((n, item)=>{
				weakMapAddSet(lookups, item).forEach(pubsub=>{
					if (!name || names.get(pubsub).has(name)) pubsubs.add(pubsub)
				});
			});
			return pubsubs;
		}

		this.publish = (...params)=>{
			getPubSubs(this).forEach(pubsub=>pubsub.publish(...params));
			return this;
		};

		this.broadcast = (...params)=>{
			getPubSubs(this).forEach(pubsub=>pubsub.broadcast(...params));
			return this;
		};

		this.subscribe = (...params)=>{
			getPubSubs(this).forEach(pubsub=>pubsub.subscribe(...params));
			return this;
		};

		return this;
	};
}
//endRemoveIf(node)