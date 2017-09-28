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

## Event instances

The subscription callbacks will receive an event object with the following properties:

* **data** {*any*} The value that was published
* **target** {*string*} The channel that is receiving it (in-case it has bubbled or a callback can fire against muliple channels).

## Broadcasting

You can also broadcast, which is the opposite to publishing in terms of bubbling.  If you broadcast then all decendant channels receive instead of all ancestor.  Think of broadcasting as firing down and publishing firing up.

**Note:** Regular expression subscriptions will not fire for broadcast messages.

```javascript
pubsub.broadcast('/', "My message to everyone!"); 
```
