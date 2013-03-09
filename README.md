Kache
=====

A Simple memory cache for Node.js.

More info coming soon.

##Install

```bash
$ npm install kache
```

##Example Usage

```javascript

// Include the module
var kache = require('kache');

// Set some options - these are the defaults
var options = {
    start: true     // Start a timer to remove old cache entries.
  , interval: 300   // Time in seconds between each scan.
};

// Create a new cache
var cache = kache(options);

// Set 'hello' to 'hello world' - expires in 3 seconds
cache.set('hello', 'hello world', 3);

// Get 'hello' from the cache and log to console
console.log(cache.get('hello')); // Outputs: 'hello world'

// Wait 5 seconds and try again. The item will have expired and is no longer available.
setTimeout(function() {
  console.log(cache.get('hello')); // null
}, 5000);
```

##Warning

This is very much a work in progress, there may be bugs and you can probably expect some API changes!

##TO-DO

 * **Maximum Cache Size:** Delete old items from the cache when the cache is full.
 * **LRU:** Implement a [Least Recently Used](http://en.wikipedia.org/wiki/Cache_algorithms#Least_Recently_Used) Mode