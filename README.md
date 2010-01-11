# Chain

A "chain" is a series of links which represent an HTTP server.  To create a chain, call the chain() function, supplying a valid "link" to it.  This function returns the resulting chain, which is a callable, and may be called again to add another link.

To signal the end of a chain of links, call the function with no arguments.  This terminates the chain.  If a chain does not have an eventual terminus, then it will throw an error.

To listen on a specific port, call the .listen() member of the properly terminated chain, supplying an optional port number and/or hostname pattern.  (Default port number is 80, and accept any hostname.)

## Links

A link is one of three things:

1. A "worker link" (see below)
2. A "routing link"
3. A chain

### Worker Link

A worker link is the most basic sort of link.  It is a function that takes two arguments, representing a request and a response.  It is called in the context of the ChainWalker object for this request.

It's purpose is to send a body, or headers, or do some other stuff with the request and response, and then signal the ChainWalker to move on to the next link in the chain.  It is agnostic as to its place in the chain, and encapsulates a bit of functionality in an isolated and modular way.

Worker Links are generally the basic unit of functionality in a chain.  See the ChainWalker, ChainRequest, and ChainResponse object descriptions for more understanding of what they can do.

To add a link to a chain, simply pass it in as the single argument.

#### Traceback

When it hits the end of the chain, a ChainWalker will begin the "traceback" portion of the request lifecycle.  At this point, any traceback functions that were added will be executed in reverse order.  See the ChainWalker spec below for more information.

Worker links may add tracebacks in one of two ways:

1. Statically, by either containing a "traceback" member or supplying a function named "traceback" as an argument to chain() along with the worker link.
2. Dynamically, by calling the ChainWalker's addTraceback function at run time.

Static tracebacks are preferred when possible, as they allow for greater optimization.  However, dynamic tracebacks afford a much greater degree of flexibility to perform cleanup that may not be necessary in all cases.

Note that tracebacks may be executed either before or after the request has been finished.

#### Setup

If a link needs to perform some actions before the request starts (generally, attaching a listener to the "start" event, or canceling the entire chain from the get-go for some reason), it may use a setup function.  If a link needs to attach event listeners, and wants to be notified of events that occur *before* the ChainWalker has reached it, then it must use a setup function.

To supply a setup function, either pass a function named "setup" to the call to chain(), or attach the setup function as a "setup" member of the worker link function.

Setup functions may not be added dynamically, because by that point, the setup phase is already past.

**Important**: Note that setup functions are called *whether or not the link in question is eventually walked over*, so use them sparingly.  It is quite possible to degrade performance by attaching a lot of setup() handlers that will slow down every request, and it makes for a mishmosh of functionality that is hard to track.

#### Worker Links without a Walk Phase Action

In some cases, you may want to have a worker link that does some setup at the start of the walk, and/or attaches a traceback in case the ChainWalker passes by, but actually doesn't need to do anything else dynamically per-request.

In that case, simply set up the link using the methods described above for tracebacks and setup functions, but don't supply a link callable.  Ie:

1. Pass an object with a traceback/setup member(s).  This is the whole link, and since isn't a callable, it will be skipped over in the walk phase.
2. Pass a function named "setup" and/or a function named "traceback".  These will be interpreted as the appropriate things, and since no generic callable was supplied, then the walk phase will skip over this link.
3. Some combination of 1 and 2.

### Router Link

A router link is an explicit "branch" in the chain.  To create a router link, pass two arguments to the chain() function: a "pattern" (see below) and a link.  Note that a chain or a router are valid link types, so passing in a pattern and a chain are valid, or a pattern and another router.

If the pattern matches, then the ChainWalker next processes the associated link.  If that link is a terminated chain, then the request will be finished when it gets to the end.  If it is an unterminated chain (or a single link), then the ChainWalker will process all the links in the chain, and then "fall through" to the next link after the router.

#### Router Patterns

Router Patterns make take four shapes:

1. A string which is matched against the "pathname" portion of the request.url.  It must match exactly.
2. A regular expression which is applied against the "pathname" portion of the request.url.
3. An object containing "pattern" and "field" members.  The "pattern" is matched against the "field" member of the request object.  (This is handy for matching against the existence of a cookie, or a particular browser or IP range, etc.)
4. A function named "test" which takes the request object, and returns either true or false.  It is called in the context of the ChainWalker object.

### Chains as Links

A chain object may be used as a link.  This allows multiple related pieces of functionality to be encapsulated and treated as a single object.  For instance, a "StaticFileServer" might be implemented as a chain of related functionality (perhaps one link for streaming gzip/deflate, another for adding the mime-type, and another for streaming the file out.)  While it is implemented as multiple links under the hood, it may be plugged in and managed as if it were a single link.

## ChainWalker

When a request comes into a chain server, a ChainWalker is created to walk down the chain processing the request.  Worker Link functions are executed in the context of the ChainWalker, so they may access its members and methods using "this".

### Methods

`next` - Move on to the next item in the chain.  
`finish` - Finish the request, send the headers, etc.  
`sendBody` - Send some bytes to the client.  
`sendHeader` - Send a status and header object to the client. (Pass "true" as the third arg to "send now", rather than buffering.)  
`before` - Opposite of "after".  Pass in a method name (such as "sendBody") and a function.  The supplied function will be executed before the method named.  If it returns boolean false, then the method call is cancelled.  Function will be called in the context of the ChainWalker.  
`after` - Opposite of "before".  Pass in a method name (such as "sendBody") and a function.  The supplied function will be executed after the method named, and thus cannot affect the default method behavior.  Function will be called in the context of the ChainWalker.  

### Events

All events are fired in the context of the ChainWalker object.

`start` - This is handled by the chain system internally.  It fires prior to beginning the walk down the chain, so may only be accessed if a link used a setup() function.  Listeners receive the request object as an argument, and may return a modified request object.  
`next` - Fired each time the walker progresses to the next link.  Listeners receive the request object, the previous link, and the next link as arguments, and may return a different "next" link.  
`phaseChange` - Fired each time the ChainWalker changes phases.  (See below for lifecycle phases.)  
`finish` - Fired when the request is finished.  NB: if you want to cancel or modify the request *before* it finishes, then you must use the `before` method, because the `finish` event doesn't occur until after it has happened.  
`error` - Fired whenever an error happens.  
`walkComplete` - Fired after the "complete" phase is over.

### Members

`request` - The raw request object that Node supplies.  Best not to touch this unless you really know what you're doing.  Use the supplied functions to do what you need to, as touching this member will circumvent the AOP stuff.  
`response` - The raw response object that Node supplies.  Best not to touch this unless you really know what you're doing.  Use the supplied functions to do what you need to, as touching this member will circumvent the AOP stuff.  
`chain` - A reference to the chain that served as the entry point for this walk.  
`phase` - A string indicating the current phase.  (See below for lifecycle phases.)  
`currentLink` - The current link being processed.  
`tracebacks` - A stack of added traceback that will be called when it hits the end of the chain.

### Lifecycle Phases

The ChainWalker handles the request through the following phases in processing a request.  Any phase change can be listened to by attaching a handler to the "phaseChange" event.

#### setup

During the setup phase, the ChainWalker applies all setup functions that have been added.

At the end of the setup phase, the ChainWalker fires the "start" event.

#### walk

After the "start" event has fired, the ChainWalker switches into the "walk" phase, and begins walking down the chain.  This is where most of the action happens.

#### traceback

When the ChainWalker hits the end of the chain, it starts the "traceback" phase, executing the stack of traceback functions in reverse order corresponding to the path it took through the chain.

#### complete

When the ChainWalker traces back to the head of the chain, it enters the "complete" phase.  In this phase, it calls finish() if it hasn't already done so, and then falls out of scope and gets garbage collected.
