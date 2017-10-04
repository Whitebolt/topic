//removeIf(node)
if (window.jQuery || window.$) {
	const $ = window.jQuery || window.$;
	const pubsubs = new Map();

	$.pubsub = function(name, ...params) {
		if (!pubsubs.has(name)) pubsubs.set(name, new PubSub(...params));
		return pubsubs.get(name);
	};
}
//endRemoveIf(node)