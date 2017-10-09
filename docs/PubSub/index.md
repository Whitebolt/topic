# PubSub()

Publish and Subscription class.

### Basic Example

```javascript
const PubSub = require('topic-subscribe');
const pubsub = new PubSub();
```

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


## Methods
 * [broadcast](./broadcast.md)
 * [mirror](./mirror.md)
 * [publish](./publish.md)
 * [source](./source.md)
 * [subscribe](./subscribe.md)
 * [unsubscribe](./unsubscribe.md)


## See also
  
 * [Message Class](../Message/index.md)
 * [PubSub Class](./index.md)
   

  [Index](../ReadMe.md)