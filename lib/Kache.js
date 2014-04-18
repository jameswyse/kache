//
// Kache
// =====
//
// *A very simple memory cache for node.js*
//
// **Version:** 0.1.0
//
// **Author:** [James Wyse](http://lemoncreative.net)
//
// **GitHub:** [jameswyse/kache](https://github.com/lemoncreative/kache/)
//
// **NPM:** [kache](https://npmjs.org/package/kache)

// ## Module Dependencies
var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var debug        = require('debug')('cache');
var _            = require('lodash');

// ## Kache Constructor
//
// *Creates a new Kache Object.*
//
// **Arguments:**
// - **options:** `Object` Set runtime options
//
// **Returns:** `Object` A new Kache Object
var Kache = function(options) {

  options       = options || {};
  options.start = options.start || true;

  this.lru      = options.lru || false;
  this.max      = _.isNumber(options.max) ? options.max : Infinity;
  this.interval = _.isNumber(options.interval) ? (options.interval * 1000) : 300000;

  this.cache   = {};
  this.length  = 0;
  this.hits    = 0;
  this.misses  = 0;

  if(options.start) this.start();
};

// Inherits from EventEmitter
util.inherits(Kache, EventEmitter);


// ## Item Constructor
//
// *Creates a new Item Object*
//
// **Arguments:**
// - **value:** `Mixed` Contents of cached item.
// - **ttl:** `Number` in seconds to store this Item in the cache.
//
// **Returns:** `Object` a new Item Object
var Item = function(value, ttl) {
  var now        = Date.now();
  this.createdAt = now;
  this.lastGet   = now;
  this.value     = value;
  this.ttl       = _.isNumber(ttl) ? (ttl * 1000) : Infinity;
};


// ## Kache#set
//
// *Sets (adds or replaces) an Item in the cache*
//
// **Arguments:**
// - **key:** `String`
// - **value:** `Mixed`
// - **ttl:** `Number` in seconds to store this Item in the cache.
//
// **Returns:** `Mixed` The value
Kache.prototype.set = function set(key, value, ttl) {
    debug('Set: %s = %j (TTL: %s)', key, value, (_.isNumber(ttl) ? ttl : 'None'));
    if(!this.has(key))
      this.length++;
    this.cache[key] = new Item(value, ttl);

    // Return the value for situations like:
    // ```javascript
    // var name = cache.get('name') || cache.set('name', 'James', 3600);
    // ```
    return value;
};


// ## Kache#get
//
// *Retrieves a value from the cache*
//
// **Arguments:**
// - **key:** `String`
// - **def:** `Mixed` The default value to return when the cache is missing.
// - **callback:** `Function` Callback function `callback(err, value)`
//
// **Returns:** `Mixed` The retrieved value or default value if the Item is missing.
Kache.prototype.get = function get(key, def, callback) {
  if(this.valid(key)) {
    this.hits++;

    if(this.lru) this.cache[key].lastGet = Date.now();

    if(_.isFunction(callback)) callback(null, this.cache[key].value);
    return this.cache[key].value;
  }

  this.misses++;
  if(_.isFunction(callback)) callback(null, def || null);
  return def || null;
};


// ## Kache#Del
//
// *Deletes an Item from the cache*
//
// **Arguments:**
// - **key:** `String`
//
// **Returns:** `Object` The Kache Object for chaining*
Kache.prototype.del = function remove(key) {
  if(!this.has(key)) return this;

  debug('Del: %s',key);
  delete this.cache[key];
  this.emit('remove', key);
  this.length--;

  return this;
};


// ## Kache#Expired
//
// *Checks if an Item has expired*
//
// **Arguments:**
// - **key:** `String`
//
// **Returns:** `Boolean`
Kache.prototype.expired = function expired(key) {
  var item = this.cache[key];

  if(!item || item.expired === true) return true;

  item.expired = (Date.now() - item.createdAt) > item.ttl;
  return item.expired;
};


// ## Kache#has
//
// *Checks if an item exists in the cache*
//
// **Arguments:**
// - **key:** `String`
//
// **Returns:** `Boolean`
Kache.prototype.has = function check(key) {
  return this.cache.hasOwnProperty(key);
};


// ## Kache#valid
//
// *Checks if a cached Item is valid.*
// An Item is valid if it exists and has no Expired
//
// **Arguments:**
// - **key:** `String`
//
// **Returns:** `Boolean`
Kache.prototype.valid = function valid(key) {
  return this.has(key) && !this.expired(key);
};


// ## Kache#invalid
//
// *Checks if a cached Item is invalid.*
// Reversed Kache#valid
//
// **Arguments:**
// - **key:** `String`
//
// **Returns** `Boolean`
Kache.prototype.invalid = function invalid(key) {
  return !this.valid(key);
};


// ## Kache#Keys
//
// **Returns:** `Array` All keys present in the cache
Kache.prototype.keys = function keys() {
  return Object.keys(this.cache);
};


// ## Kache#expiredKeys
//
// **Returns:** `Array` All keys present in the cache which have expired
Kache.prototype.expiredKeys = function keys() {
  return this.keys().filter(function(key) {
    return this.expired(key);
  }, this);
};


// ## Kache#values
//
// **Returns:** `Array` All values present in the cache
Kache.prototype.values = function values() {
  return _.chain(this.cache)
    .values()
    .map(function(item) {
      return item.value;
    })
    .value();
};


// ## Kache#each
//
// *Iterates over each item in the cache excluding expired items.*
// Same API as `Array.prototype.forEach`
//
// **Arguments:**
// - **callback:** `Function` Callback function
// - **thisArg:** `Mixed` Sets the value of `this` on the callback function.
Kache.prototype.each = function each(callback, thisArg) {
  thisArg = thisArg || this;

  return this
    .keys()
    .forEach(function(key) {
      if(this.expired(key)) return;
      callback.call(thisArg, key, this.cache[key].value, this.cache[key].ttl);
    }, this);
};


// ## Kache#Empty
//
// *Empties the entire cache*
//
// **Returns:** `Object` The Kache Object for chaining
Kache.prototype.empty = function removeAll() {
  this.cache = {};
  this.length = 0;
  return this;
};


// ## Kache#Scan
//
// *Scans the cache to remove old items*
//
// **Returns:** `Object` The Kache Object for chaining
Kache.prototype.scan = function scan() {
  debug('Scanning Cache');
  this.purgeExpired();
  this.purgeOldest();

  return this;
};


// ## Kache#purgeOldest
//
// *Reduces the size of the cache to the maximum allowed size by removing the oldest Items.*
//
// **Returns:** `Object` The Kache Object for chaining
Kache.prototype.purgeOldest = function purgeOldest() {
  if(!this.max || this.length < this.max) return;

  // **TODO:** Find and delete the oldest items from the cache
  return this;
};


// ## Kache#purgeExpired
//
// *Checks the entire cache for expired objects*
//
// **Returns:** `Object` The Kache Object for chaining
Kache.prototype.purgeExpired = function purgeExpired() {
  this.expiredKeys().forEach(function(key) {
    debug('Expired: %s', key);
    this.del(key);
  }, this);
  return this;
};


// ## Kache#start
//
// *Starts the background worker*
//
// **Returns:** `Object` The Kache Object for chaining
Kache.prototype.start = function start() {
  if(this.worker) this.stop();
  this.worker = setInterval(this.scan.bind(this), this.interval);
  return this;
};


// ## Kache#stop
//
// *Stops the background worker*
//
// **Returns:** `Object` The Kache Object for chaining
Kache.prototype.stop = function stop() {
  if (this.worker)
    clearInterval(this.worker);
  return this;
};


// ## createCache
//
// *Kache Factory*
//
// **Returns:** `Object` A new Kache Object
function createCache(options) {
  return new Kache(options);
}

// ## Export createCache
module.exports = createCache;
