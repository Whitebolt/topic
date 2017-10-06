[![Build Status](https://travis-ci.org/Whitebolt/topic-subscribe.svg?branch=master)](https://travis-ci.org/Whitebolt/topic-subscribe)

# Topic Subscribe
Publish and subscription module with broadcast and message filtering.

## Install

```bash
npm install topic-subscribe
```

or

```bash
yarn install topic-subscribe
```

**To save to your** *package.json*

```bash
npm install --save topic-subscribe
```

## Basic use

```javascript
const PubSub = require('topic-subscribe');
const pubsub = new PubSub();

pubsub.subscribe('/server/errors', {level: {$lt:3}}, evt=>{
    console.log(`Error on server (level: ${evt.data.level})`, evt.data.description);
});

pubsub.publish('/server/error', {
    level: 4, // This message will not been seen by the above subscription.
    description: 'Minor error event, noting to see'
}); 

pubsub.publish('/server/error', {
    level: 1, // This will been by the above subscription
    description: 'Critial error, shutdown in progress'
}); 
```

This shows basic use.  A channel subscription is set and we filter the results to only include messages with level less than 3.  Two messages are published to the same channel and one will be received by our callback because the priority is less than 3.

## Subscribing to a channel

To subscribe to a channel, simply provide the channel and a callback.

```javascript
pubsub.subscribe('/my-channel/my-subchannel', evt=>{
    // Respond to message
});
```

This is the most basic and simple subscription.  A filter object can be supplied to filter out unwanted messages. This allows the callback to be limited to the specific instance we need.  A good use for this might be a server error channel.  If errors had severity levels we might only be interested in the most severe errors.

```javascript
const ERRORLEVELS = {
    critical: 1,
    severe: 2,
    minor: 3,
    warning: 4,
    info: 5
}

pubsub.subscribe('/my-channel/my-subchannel', {
    errorLevel: {$lte: ERRORLEVELS.critical}
}, evt=>{
    // Respond to critical error
});
```

The filtering uses the [sift](https://www.npmjs.com/package/sift) module.  Sift has similar syntax to mongo queries. All the functionality of sift is available.

You can also subscribe to more than one channel at a time:

```javascript
pubsub.subscribe([
    '/my-channel/my-subchannel',
    '/some-other-channel/another-subchannel'
], evt=>{
    // Respond to message
});
```

The channels parameter can be a string, an array, a set or a regular expression. Each item in an array / set can be a string or a regular expression.

## Regular expressions

You can use a regular expression when subscribing to a channel instead of a basic string.  However, if you do they will not receive broadcast messages as there is no consistent way to calculate ancestor channels of a regular expression derived channel.

## Subscription bubbling

It each subscription will receive all messages (barring any filters you set) on the subscribe channel and any messages sent on child and decendant channels.

So, subscription to **/my-channel**, might receive from: 
**/my-channel**,
**/my-channel/my-subchannel**,
**/my-channel/my-subchannel/my-sub-subchannel**, 
**...any other decendant channel**

If you subscribe to **/** you will receive all messages publidhed.

**Note:** All channels must start with */* or an error will be thrown.

## Publishing to a channel

Publishing is really simple:

```javascript
pubsub.publish('/interesting-messages', "My message"); 
```

This will publish a message to the **/interesting-messages** channel.

## Message instances

The subscription callbacks will receive an message object with the following properties:

* **data** {*any*} The value that was published
* **target** {*string*} The channel that is receiving it (in-case it has bubbled or a callback can fire against multiple channels).

## Broadcasting

You can also broadcast, which is the opposite to publishing in terms of bubbling.  If you broadcast then all decendant channels receive instead of all ancestor.  Think of broadcasting as firing down and publishing firing up.

**Note:** Regular expression subscriptions will not fire for broadcast messages.

```javascript
pubsub.broadcast('/', "My message to everyone!"); 
```

## Unsubscribe

The subscribe method returns an unsubscribe function.  Removing the listener is simply a matter of calling the function.

```javascript
const unsubscribe = pubsub.subscribe('/');
unsubscribe();
```

You can perform blanket operations using the unsubscribe method.  It accepts a channel name, regular-expression, function or an array of any of these together.  If a function is supplied a listener is assumed and this is unsubscribed from wherever it is
subscribed.  If a string or regular-expression is given then unsubscribe all listeners from those channels.

```javascript
pubsub.unsubcribe('/');
pubsub.unsubcribe(['/', '/my-error-channel']);
pubsub.unsubcribe(myListener);
pubsub.unsubcribe([myListener1, myListener2, /test[0-9]/, '/test-channel');
```


## Older node version

This module uses babel in build process to ensure it works on everything above node v4.0 (sorry, we cannot do less than that without rewriting dependencies).  The lead developer spent most of his early programming career working on Lotus Notes Systems and building intranets for IE8! We therefore, understand the need for legacy suport and will endeavour to keep this module backwards compatible.

## jQuery

The browser module will automatically export a new function to jQuery if present.  To create a new PubSub instance, simply call the function on a dom query.  This will assign a PubSub instance to each item in the collection.

```javascript
jQuery("div.my-app").pubsub().subscribe("/my-channel", event=>{
	// do something
}); 

jQuery("div.my-app").pubsub(").publish("/my-channel", "hello"); 

jQuery("div.my-app").pubsub().broadcast("/", "Global message");
```

The jQuery functions return a the original query so actions can be chained.  This means an unsubscribe function is not passed back.  Unsubscriptions require the use of the unsubscribe function.

```javascript
jQuery("div").pubsub().unsubscript("/my-channel"); 
jQuery("div").pubsub().unsubscript(myListener); 
```

## Angular

There is an angular factory in the **TopSubscribe** module called *pubsub* that is automatically exported if angular is detected. This module is still in beta.

## Browser code

All the browser code is in beta but new features should be added if you watch this space.  We wish to have an Angular 2/4 module and a global export too.  Also, we want some way of selecting what is exported.
