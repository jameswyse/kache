// Include the module
var kache = require('../lib/Kache');

// Set some options - these are the defaults
var options = {
  start: true,     // Start a timer to remove old cache entries.
  interval: 300    // Time in seconds between each scan.
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
