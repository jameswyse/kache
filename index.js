/**
 *  Kache
 *  Kache - A Simple Memory Cache
 *  Version 0.0.2
 *  https://github.com/lemoncreative/kache/
 */

/**
 *  Module Dependencies
 */
var EventEmitter = require('events').EventEmitter
  , inherits     = require('inherits')
  , debug        = require('debug')('cache')
  , _            = require('underscore');

/**
 * Kasch Constructor
 *
 * @param {Object} options Options
 * @param {Array}  payload An array of Objects to preload the cache with.
 * @constructor
 * @api   public
 */
var Kache = function(options, payload) {
  Kache.super.apply(this);

  // Instance options & defaults
  options       = options || {};
  options.start = options.start || true;

  this.lru      = options.lru || false;
  this.max      = _.isNumber(options.max) ? options.max : Infinity;
  this.interval = _.isNumber(options.interval) ? (options.interval * 1000) : 300000;

  // Cache storage
  this.cache   = {};
  this.length  = 0;
  this.hits    = 0;
  this.misses  = 0;

  // Add payload to cache
  // @todo

  // Start scanner
  if(options.start)
    this.start();
};

inherits(Kache, EventEmitter);

/**
 * Item Constructor
 *
 * @param {Object} value Contents of cached item
 * @param {Number} ttl   Number of seconds to store this Item in the cache
 * @constructor
 * @api   public
 */
var Item = function(value, ttl) {
  var now = Date.now();
  this.createdAt = now;
  this.lastGet   = now;
  this.value     = value;
  this.ttl       = _.isNumber(ttl) ? (ttl * 1000) : Infinity;
};

/**
 * Add or replace an item in the cache
 *
 * @param {String} key   Key
 * @param {Mixed}  value Value
 * @param {Number} ttl   Number of seconds to store this Item in the cache
 * @api   public
 */
Kache.prototype.set = function set(key, value, ttl) {
    debug('Set: %s = %j (TTL: %s)', key, value, (_.isNumber(ttl) ? ttl : 'None'));
    if(!this.has(key))
      this.length++;
    this.cache[key] = new Item(value, ttl);

    // Return the value so we can do:
    // var name = cache.get('name') || cache.set('name', 'James', 3600);
    return value;
};

/**
 * Get an item from the cache
 *
 * @param  {String}   key      Key
 * @param  {Mixed}    def      Default Value to return
 * @param  {Function} callback Optional callback with err and value parameters
 * @return {Mixed}             Either callback(err, value|def|null) or value|def|null
 * @api    public
 */
Kache.prototype.get = function get(key, def, callback) {
  if(this.valid(key)) {
    this.hits++;
    if(this.lru)
      this.cache[key].lastGet = Date.now();
    return _.isFunction(callback) ? callback(null, this.cache[key].value) : this.cache[key].value;
  }
  this.misses++;
  return _.isFunction(callback) ? callback(null, def || def) : def || null;
};

/**
 * Remove an Item from the cache
 *
 * @param {String} key  Key
 * @api   public
 */
Kache.prototype.del = function remove(key) {
  if(!this.has(key)) return this;
  debug('Del: %s',key);
  delete this.cache[key];
  this.emit('remove', key);
  this.length--;
  return this;
};

/**
 * Check if an item has expired
 *
 * @param  {String} key Key
 * @return {Boolean}    Whether or not the item has expired
 * @api    public
 */
Kache.prototype.expired = function expired(key) {
  return this.cache[key].expired === true || (this.cache[key].expired = (Date.now() - this.cache[key].createdAt) > this.cache[key].ttl);
};

/**
 * Check if an item exists in the cache
 *
 * @param  {String}   key  Key
 * @return {Boolean}       Whether or not the item exists
 * @api public
 */
Kache.prototype.has = function check(key) {
  return this.cache.hasOwnProperty(key);
};

/**
 * Returns true if the item exists and has not expired
 *
 * @param  {String}   key  Key
 * @return {Boolean}       Whether or not the item is valid
 * @api public
 */
Kache.prototype.valid = function valid(key) {
  return this.has(key) && !this.expired(key);
};

/**
 * Returns true if the item doesn't exist or has expired
 *
 * @param  {String}   key  Key
 * @return {Boolean}       Whether or not the item is invalid
 * @api public
 */
Kache.prototype.invalid = function invalid(key) {
  return !this.valid(key);
};

/**
 * Returns an Array containing all the keys in the cache
 *
 * @return {Array} Keys of items currently in the cache
 * @api public
 */
Kache.prototype.keys = function keys() {
  return Object.keys(this.cache);
};

/**
 * Returns an Array containing keys of items which have expired
 *
 * @return {Array} Keys of items which have expired
 * @api public
 */
Kache.prototype.expiredKeys = function keys() {
  return this.keys().filter(function(key) {
    return this.expired(key);
  }, this);
};

/**
 * Returns an Array containing all the values in the cache
 *
 * @return {Array} All values from the cache
 * @api public
 */
Kache.prototype.values = function values() {
  return _.chain(this.cache)
    .values()
    .map(function(item) {
      return item.value;
    })
    .value();
};

/**
 * Returns a list of `[key, value]` pairs
 *
 * @return {Array} An Array containing `[key, value]` pairs for every item in the cache
 * @api public
 */
Kache.prototype.pairs = function pairs() {
  // @todo
};

/**
 * Iterate over each item in the cache excluding expired items.
 * Same API as `Array.prototype.forEach`
 *
 * @param  {Function} callback Callback Function
 * @param  {Object}   thisArg  The value to set this to
 * @return {Object}            The entire cache
 * @api public
 */
Kache.prototype.each = function each(callback, thisArg) {
  thisArg = thisArg || this;

  return this.keys().forEach(function(key) {
    if(this.expired(key)) return;
    callback.call(thisArg, key, this.cache[key].value, this.cache[key].ttl);
  }, this);
};

/**
 * Empty the entire cache
 *
 * @api public
 */
Kache.prototype.empty = function removeAll() {
  this.cache = {};
  this.length = 0;
  return this;
};

/**
 * Scan the cache and remove old items
 *
 * @api public
 */
Kache.prototype.scan = function scan() {
  debug('Scanning Cache');
  this.purgeExpired();
  this.purgeOldest();

  return this;
};

/**
 * Reduce the size of the cache to the maximum allowed size
 * by removing the oldest items.
 *
 * @api public
 */
Kache.prototype.purgeOldest = function purgeOldest() {
  if(!this.max || this.length < this.max) return;

  // @todo: Find and delete the oldest items from the cache
  return this;
};

/**
 * Checks the entire cache for expired objects
 *
 * @api public
 */
Kache.prototype.purgeExpired = function purgeExpired() {
  this.expiredKeys().forEach(function(key) {
    debug('Expired: %s', key);
    this.del(key);
  }, this);
  return this;
};

Kache.prototype.start = function start() {
  if(this.worker) this.stop();
  this.worker = setInterval(this.scan.bind(this), this.interval);
  return this;
};

Kache.prototype.stop = function stop() {
  if (this.worker)
    clearInterval(this.worker);
  return this;
};

function createCache(options) {
  return new Kache(options);
}

module.exports = createCache;