var expect = require('chai').expect;
var async = require('async');
var ttl = require('level-ttl');

var test_db_path = __dirname + '/test';
var rimraf = require('rimraf');

try{
  rimraf.sync(test_db_path);
}catch(err){
  console.log(err);
}

var level = require('level');

var TokenBucket = require('../');
var db = ttl(level(test_db_path));

var bucket = new TokenBucket({
  db: db,
  name: 'my-bucket',
  size: 100,
  interval: 100,
  tokensPerInterval: 10,
  checkFrequency: 10
});

describe('TokenBucket', function () {

  beforeEach(function (done) {
    db.del(bucket._name, done);
  });

  it('should return the amount of available tokens', function (done) {
    bucket.take(3, function (err, result, bucket) {
      if (err) return done(err);
      expect(result).to.equal(true);
      expect(bucket.content).to.equal(97);
      done();
    });
  });

  it('should run out of tokens', function (done) {
    var take = function (cb) {
      bucket.take(40, function (err, r) {
        cb(err, r);
      });
    };

    async.series([take, take, take], function (err, result) {
      if (err) return done(err);
      expect(result[0]).to.equal(true);
      expect(result[1]).to.equal(true);
      expect(result[2]).to.equal(false);
      done();
    });
  });

  it('should drip tokens into the bucket', function (done) {
    var take = function (cb) {
      bucket.take(40, function (err, r, b) {
        // console.log('bucket: ', b);
        cb(err, r);
      });
    };

    var waitAndTake = function (cb) {
      setTimeout(take.bind(null, cb), 200);
    };

    async.series([take, take, take, waitAndTake], function (err, result) {
      if (err) return done(err);
      expect(result[0]).to.equal(true);
      expect(result[1]).to.equal(true);
      expect(result[2]).to.equal(false);
      expect(result[3]).to.equal(true);
      done();
    });
  });

  it('should delete unused buckets', function (done) {
    bucket.take(40, function (err) {
      if (err) return done(err);
      setTimeout(function (){
        bucket._db.get('bucket', function (err) {
          expect(err.name).to.equal('NotFoundError');
          done();
        });
      }, 1000);
    });
  });

});
