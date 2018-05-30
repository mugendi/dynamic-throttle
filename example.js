var Throttle = require('.'),
    async = require('async');

    
var throttler = Throttle({}),
    key = 'test key',
    tokens = 500,
    window = 'minute';



var calls = 20;


async.eachLimit(Array(calls), 1, function (value, cb) {


    throttler.throttle(key, tokens, window)
        .then(function (resp) {
            console.log(resp)
            cb(null, resp);
        })
        .catch(function (resp) {
            console.log(resp)
            cb(null, resp);
        })


}, function (err, resp) {
    // we should now have 5 users
    console.log(resp)
});