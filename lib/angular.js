if (window.angular) {
	const pubsub = new PubSub();
	window.angular.module("TopSubscribe", []).factory("pubsub", pubsub);
}