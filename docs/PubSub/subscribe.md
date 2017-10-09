# subscribe()

Subscribe to information published on a given channel(s) path with optional filtering. If a regular-expression is given for a channel it will receive published data but not broadcast data.

 | Parameter | Type | Optional | Default | Description |
 | --- | --- | --- | --- | --- |
 | *channel* | string \| Array \| Set | No | | Channel(s) to publish on. |
 | *filter* | Sift-Query | Yes | {} | Filter to sift-out unwanted messages. |
 | *listener* | Function | No | | The listener to call. |
 | ***return*** | **Function** | | |**Unsubscribe function.** |
 
 ## Subscribing

All subscriptions are handled via the subscribe method.  Multiple channels can be subscribed to in one operation and listeners will also, receive bubbled-messages depending on whether it was a publish or broadcast.

 ### Example

```javascript
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

## Subscribing to muliple channels

You can also subscribe to more than one channel at a time:

### Example

```javascript
pubsub.subscribe([
    '/my-channel/my-subchannel',
    '/some-other-channel/another-subchannel'
], evt=>{
    // Respond to message
});
```

The channels parameter can be a string, an array, a set or a regular expression. Each item in an array / set can be a string or a regular expression. **Listeners will fired only once for each publish/broadcast**.

## Message Bubbling

Messages either bubble up or down the channel depending on whether a broadcast or publish is chosen.  Publish (which is the default) will bubble messages up ancestor channels till root **/** is reached.  Broadcast is the opposite, bubbling messages down to descendant channels.

## Regular expressions

You can use a regular expression when subscribing to a channel instead of a basic string.  However, if you do they will not receive broadcast messages as there is no consistent way to calculate ancestor channels of a regular expression derived channel.
  
## jQuery

The jQuery subscribe method works in the same way as the node version, except for the method return value.  A jQuery instance is returned for chaining.

 | Parameter | Type | Optional | Default | Description |
 | --- | --- | --- | --- | --- |
 | *channel* | string \| Array \| Set | No | | Channel(s) to publish on. |
 | *filter* | Sift-Query | Yes | {} | Filter to sift-out unwanted messages. |
 | *listener* | Function | | | The listener to call. |
 | ***return*** | **jQuery** | | | **The jQuery instance this publish was called on.  Useful for chaining** |



  ### Example:
```javascript
jQuery("div.my-app").pubsub(").subscribe("/my-channel", ()=>{
		// Message handler
}); 
```

## See also
  
 * [Message Class](../Message/index.md)
 * [PubSub Class](./index.md)
   

  [Index](../../ReadMe.md)
 