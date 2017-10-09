# broadcast()

Broadcast a message to the given channel(s). Broadcasting causes a message to be read on given channel and all descendant channels. Will not be read on channel subscriptions that are regular-expressions.

 | Parameter | Type | Description |
 | --- | --- | --- |
 | *channel* | string \| Array \| Set | Channel(s) to publish on. |
 | *message* | * | Message to broadcast. |
 | ***return*** | **boolean** | **Did the message publish?** |
 