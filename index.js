var update = require('./lib/updater');

/**
 * Create a token bucket.
 *
 * @param  {[type]} params [description]
 * @return {[type]}        [description]
 */
function TokenBucket (params) {
  if (!(this instanceof TokenBucket)) {
      return new TokenBucket(params);
  }
  if (typeof params != 'object'){
    throw new Error('must supply an parameter object');
  }
  if (typeof params.name !== 'string') {
    throw new Error('must supply a `name` parameter');
  }
  if (typeof params.size !== 'number') {
    throw new Error('must supply a `size` parameter');
  }
  if (typeof params.interval !== 'number') {
    throw new Error('must supply a `interval` parameter');
  }
  if (typeof params.tokensPerInterval !== 'number') {
    throw new Error('must supply a `tokensPerInterval` parameter');
  }
  if (!params.db) {
    throw new Error('must supply a `db` parameter');
  }
  if (!params.db.ttl) {
    throw new Error('db must have `ttl` installed');
  }

  this._interval = params.interval;
  this._tokensPerInterval = params.tokensPerInterval;
  this._size = params.size;
  this._name = params.name;

  //prepare the db interface
  this._db = params.db;

  /**
   * add the delta of tokens to the bucket.
   * copied from https://github.com/jhurliman/node-rate-limiter
   */
  function drip (bucket) {
    var now = +new Date();
    var deltaMS = Math.max(now - bucket.lastDrip, 0);

    var dripAmount = Math.floor(deltaMS * (params.tokensPerInterval / params.interval));
    var content = Math.min(bucket.content + dripAmount, params.size);
    return { content: content, lastDrip: now };
  }

  this._take = update(this._db, function (value, param) {
    var bucket = value ? drip(value) : {
      lastDrip: Date.now(),
      content:  params.size
    };
    if (bucket.content < param) {
      var err = new Error('not enought tokens');
      err.code = 'NotEnougthTokens';
      throw err;
    }
    bucket.content -= param;
    return bucket;
  }, {
    valueEncoding: 'json'
  }).bind(this._db);
}

TokenBucket.prototype.take = function (tokens, callback) {
  var cb = callback || function noop(){};
  this._take(this._name, tokens, function (err, bucket) {
    if (err && err.code !== 'NotEnougthTokens') {
      return cb(err);
    }
    cb(null, !err, bucket);
  });
  var ttl = this._size * this._interval / this._tokensPerInterval;
  this._db.ttl(this._name, ttl);
};

module.exports = TokenBucket;