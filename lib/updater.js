//this is the same code from level-updater
//but the update function can choose to reject the update
//by throwing an error.

module.exports = function(db, updater, options) {
  var cache = {};

  function update(key, param, callback) {
    if (typeof param === 'function') {
      callback = param;
      param = null;
    }
    callback = callback || function(){};

    if (key in cache) {
      cache[key].ready.push(callback);
      cache[key].param.push(param);
      return;
    }

    cache[key] = {
        param: [param]
      , ready: [callback]
    };

    db.get(key, options, function(err, current) {
      var ready = cache[key].ready;
      var errors = [];

      var value = cache[key].param.reduce(function(current, param, index) {
        errors[index] = null;
        try{
          return updater(current, param, key);
        } catch (err) {
          errors[index] = err;
          return current;
        }
      }, current);

      delete cache[key];

      db.put(key, value, options, function(err) {
        ready.map(function(cb, index) {
          if (errors[index]) {
            return cb(errors[index], value);
          }
          return cb(err, value);
        });
      });
    });
  }

  return update;
};
