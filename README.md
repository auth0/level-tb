A persistent implementation of the [token bucket algorhitm](http://en.wikipedia.org/wiki/Token_bucket) on top of [levelup](https://github.com/rvagg/node-levelup).

Inspired by [jhurliman/node-rate-limiter](https://github.com/jhurliman/node-rate-limiter/blob/master/lib/tokenBucket.js).

## Install

~~~
npm i level-tb
~~~

## Usage

~~~javascript
var level = require('level');
var ttl = require('level-ttl');
var db = ttl(level(__dirname + '/test'));

var bucket = new TokenBucket({
  db:                db,     // the levelup instance, can be a sublevel, needs to have ttl
  name:              'buk1', // the name of the bucket, used as key
  size:              100,    // the max size of the bucket
  tokensPerInterval: 10,     // the amount of tokens added per interval
  interval:          100     // the interval lenght in milliseconds
});

bucket.take(1, function (err, result, status) {
  console.log(result); //true for conforming traffic, false for non-conforming
  console.log(status); // the status of the bucket, lastDrip and content
});
~~~

## How it works, implementation details

This implementation doesn't use timers per bucket, every time you take tokens from the bucket, we drip first the difference of tokens since last time.

New buckets are full of tokens.

Unused full buckets are discarded automatically using level-ttl. This is important if you use a bucket per user or per client to prevent DDoS attacks filling the entire disk.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

