# mirror()

Mirror a message from another pubsub source into this instance.  It expects a object with similar format to the [Message class](../Message/index.md).  Messages do not have to be identical to a Message Class but they should have a target, which is the channels to broadcast/publish to; a data property, which is the message; and either a publish or broadcast boolean property. Defaults are created for all of these properties but result might not be as you expected.

Parsers can be supplied to parse the message into the correct format. A base maybe supplied if we want to prepend a new base to each channel.

 | Parameter | Type | Optional | Default | Description |
 | --- | --- | --- | --- | --- |
 | *message* | [Message](../Message/index.md) \| Object | No | | Message to publish. |
 | *parsers* | Array.<[ParserFunction](#ParserFunction)> | Yes | [] | Parsers to parse the message. |
 | *base* | string | Yes | / | The base channel to prepend to any channels. |
 | ***return*** | **boolean** | | | **Did any listener receive the mirrored message?** |
 
 ## Mirroring
 
 The mirroring is a way of connecting one [PubSub](./index.md) to another.  Mirrored messages are mirrors not simply a republish (ie. they are clones of the original message not references).
 
 ### Example
 
 ```javascript
const PubSub = require('topic-subscribe');
const topics1 = new PubSub();
const topics2 = new PubSub();

topic2.subscribe('/other-server/server', message=>{
    // Do something
});

topic1.subscribe('/server', message=>{
    // Do something
    topic2.mirror(message, '/other-server');
});

topic1.publish('/server', {
    level: 4,
    description: 'Minor error event, noting to see'
}); 
```

<a name="ParserFunction"></a>
## Parsers

Parsers can be use to reformat a message from one message type to another or to change key properties like publish/subscribe.

 | Parameter | Type | Description |
 | --- | --- | --- |
 | *message* | Object | Clone of original message. |
 | *base* | string | **(Readonly)** The base channel to prepend to any channels. |
 | ***return*** | **Object** | **The new message** |
 
 Whatever you return becomes the new message.  If you return nothing then the received message continues to the next parser.  Since the parser receives a refence to the cloned message, you can simple mutate it.  You may however, wish to return a totally new object.
 
 ## Publishing & Broadcasting
 
 Messages will either publish or broadcast depending on the publish or broadcast value in the message object.  You cannot publish and broadcast at the same time, broadcasting will only happen if no publish is set.  Publishing is the default if nothing is set.
 
 ## jQuery
 
 The jQuery method works in exactly the same way except it returns a jQuery instance for chaining.
 
  | Parameter | Type | Optional | Default | Description |
 | --- | --- | --- | --- | --- |
 | *message* | [Message](../Message/index.md) \| Object | No | | Message to publish. |
 | *parsers* | Array.<[ParserFunction](#ParserFunction)> | Yes | [] | Parsers to parse the message. |
 | *base* | string | Yes | / | The base channel to prepend to any channels. |
 | ***return*** | **jQuery** | | | **jQuery instance for chaining.** |
 

## See also
  
 * [Message Class](../Message/index.md)
 * [PubSub Class](./index.md)
   

  [Index](../../ReadMe.md)
 