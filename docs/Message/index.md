# Message

The Message class is similar to an Event class in the browser as as some of the same properties for consistency.

| Parameter | Type | Description |
 | --- | --- | --- |
 | message | * | The actual message object - Any data. |
 | options | Object | The message to use in constructing a new message - genrally this is an object similar in fashion to a Message instance. |
 
 ### Example
 
 ```javascript
 const message = new Message("Hello World", {
    broadcast: true,
    target: ['/hello-channel']
 });
 ```

## Properties

 | Property | Type | Description |
 | --- | --- | --- |
 | data | * | The actual message object - Any data. |
 | target | Array.<string \| RegExp> | The target channels for this message. |
 | currentTarget | string | The channel the event listener is firing against to receive this message. |
 | broadcast | boolean | Is this a broadcast message.  If publish is set to true then this is ignored. |
 | publish | boolean | Is this a publish message |
 | timestamp | integer | The timestamp for the message creation in milliseconds. |
 | sourceTimestamp | integer \| undefined | If this is a mirrored message and the orginal had a timestamp, this is copy of that timestamp. |
 | eventPhase | Symbol | Are we in the bubbling phase |
 
 ## Statics
 | Property | Type | Description |
 | --- | --- | --- |
 | AT_TARGET | Symbol | Symbol for eventPhase property return, indicating that the message is not bubbling yet. |
 | BUBBLING_PHASE | Symbol | Symbol for eventPhase property return, indicating that the message is being received in the bubbling phase. |
 