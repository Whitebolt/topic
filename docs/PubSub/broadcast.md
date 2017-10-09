# broadcast()

Broadcast a message to the given channel(s). Broadcasting causes a message to be read on the given channel(s) and any descendant channels. Regular-expressions subscriptions will not receive broadcast messages.

 | Parameter | Type | Description |
 | --- | --- | --- |
 | *channel* | string \| Array \| Set | Channel(s) to broadcast on. |
 | *message* | * | Message to broadcast. |
 | ***return*** | **boolean** | **Did the message broadcast?** |
 
 ## Broadcasting
 Broadcasting is the opposite to publishing in terms of bubbling.  If you broadcast then all descendant channels receive instead of all ancestor.  Think of broadcasting as firing down and publishing as firing up.
 
 Listeners will only fire once, even if they are listening on multiple descendant children.
 
 **Note:** Regular expression subscriptions will not fire for broadcast messages. This is because there is no consistent way to calculate all descendants of a regular expression.
 
  ### Example:
  
 ```javascript
 // Broadcast to every listener on every channel.
 pubsub.broadcast('/', "My message to everyone!"); 
 ```
  
## jQuery

The jQuery broadcast method works in the same way as the node version, except for the method return value.  A jQuery instance is returned for chaining.

 | Parameter | Type | Description |
 | --- | --- | --- |
 | *channel* | string \| Array \| Set | Channel(s) to broadcast on. |
 | *message* | * | Message to broadcast. |
 | ***return*** | **jQuery** | **The jQuery instance this broadcast was called on.  Useful for chaining** |



  ### Example:
```javascript
jQuery("div.my-app").pubsub().broadcast("/", "Global message");
```

## See also
  
 * [Message Class](../Message/index.md)
 * [PubSub Class](./index.md)
   

  [Index](../../ReadMe.md)
 