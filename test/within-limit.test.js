var DRL = require('..'),
  async = require('async')


var throttler = DRL({});

describe('Within rate limit', () => {
  test('user makes 100 calls for 101 tokens', function (done) {


    var key = 'test key',
      tokens = 101,
      window = 'minute',
      calls = 100,
      response = {};


    //reset tokens
    throttler.reset(key, tokens, window)
      .then(function (resp) {

        async.eachLimit(Array(calls), 1, function (value, cb) {

          throttler.throttle(key, tokens, window)
            .then(function (resp) {
              response = resp;
              cb();
            })
            .catch(function (err) {
              response = err;
              cb();
            })

        }, function (err, resp) {

          //totaly close redis 
          // console.log(response);
          expect(response.tokensRemaining).toBeGreaterThan(0);
          expect(response.tokensRemaining).toBe(1)

          throttler.quit();

          done()

        });

      })
      .catch(

      )




  })

})

