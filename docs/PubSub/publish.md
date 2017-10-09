# publish()

Publish a message to the given channel(s). Publishing causes a message to be read on given channel and all parent channels.

 | Parameter | Type | Description |
 | --- | --- | --- |
 | *channel* | string \| Array \| Set | Channel(s) to publish on. |
 | *message* | * | Message to publish. |
 | ***return*** | **boolean** | **Did the message publish?** |
 
 ## Publishing
 Publishing is the opposite to broadcasting in terms of bubbling.  If you publish all ancestor channels will receive the message all the way up to root.  Think of publishing as firing up and broadcasting as firing down.
 
 Listeners will only fire once, even if they are listening more than one ancestors.
 
  ### Example:
  
```javascript
pubsub.publish('/interesting-messages', "My message"); 
```

This will publish a message to the **/interesting-messages** channel.  Any listeners on **/interesting-messages** or **/** will receive the message.
  
## jQuery

The jQuery publish method works in the same way as the node version, except for the method return value.  A jQuery instance is returned for chaining.

 | Parameter | Type | Description |
 | --- | --- | --- |
 | *channel* | string \| Array \| Set | Channel(s) to publish on. |
 | *message* | * | Message to publish. |
 | ***return*** | **jQuery** | **The jQuery instance this publish was called on.  Useful for chaining** |



  ### Example:
```javascript
jQuery("div.my-app").pubsub(").publish("/my-channel", "hello"); 
```

## See also
  
 * [Message Class](../Message/index.md)
 * [PubSub Class](./index.md)
   

  [Index](../../ReadMe.md)
 