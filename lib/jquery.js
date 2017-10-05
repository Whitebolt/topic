//removeIf(node)
if (window.jQuery || window.$) {
	const $ = window.jQuery || window.$;
	const mirrorActions = ['publish', 'broadcast', 'subscribe'];
	const pubsubs = new WeakMap();

	$.fn.pubsub = function(...params) {
		function pubsubGet(item) {
			if (!pubsubs.has(item)) pubsubs.set(item, new PubSub(...params));
			return pubsubs.get(item);
		}

		function pubsubAction(items, action, params) {
			items.each((n, item)=>pubsubGet(item)[action](...params));
			return items;
		}

		function pubsubMirror(actions, items) {
			actions.forEach(action=>{
				items[action] = (...params)=>pubsubAction(items, action, params)
			});
			return items;
		}

		return pubsubMirror(mirrorActions, this);
	};
}
//endRemoveIf(node)