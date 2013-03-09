Kache
=====

A Simple memory cache for Node.js.

More info coming soon.

##Install

```bash
npm install kache
```

##Usage

```bash
$ var Kache = require('kache');

var options = {
    start: true     // Start a timer to remove old cache entries.
  , interval: 300   // Time in seconds between each scan.
};

var cache = new Kache(options);

cache.set('hello', 'world', 30); // Cache for 30 seconds

cache.get('hello'); // 'world'

setTimeout(function() {
  cache.get('hello'); // null
}, 5000);
```

##Warning

This is very much a work in progress, there may be bugs and you can probably expect some API changes!

##TO-DO

 * **Maximum Cache Size:** Delete old items from the cache when the cache is full.
 * **LRU:** Implement a [Least Recently Used](http://en.wikipedia.org/wiki/Cache_algorithms#Least_Recently_Used) Mode