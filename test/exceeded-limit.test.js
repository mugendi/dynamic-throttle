var DRL = require('..'),
  async = require('async')


var throttler = DRL({});

describe('Exceeding rate limit', () => {
  test('user makes 101 calls for 100 tokens', function (done) {


    var key = 'test key',
      tokens = 100,
      window = 'minute',
      calls = 101,
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
          // console.log(response)
          expect(response.tokensExceeded).toBeLessThan(0);
          expect(response.tokensExceeded).toBe(-1);

          throttler.quit();

          done()

        });

      })
      .catch(

      )




  })

})

// test('adds 1 + 2 to equal 3', () => {
//   expect(sum(1, 2)).toBe(3);
// });