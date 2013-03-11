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

##LICENCE

MIT LICENCE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.