//removeIf(node)
if (window.angular) {
	const pubsub = new PubSub();
	window.angular.module("TopSubscribe", []).factory("pubsub", pubsub);
}
//endRemoveIf(node)