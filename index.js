const redis = require('redis'),
    humanInterval = require('human-interval'),
    moment = require('moment'),

    DRL = function (opts) {
        let self = this;

        let client = opts.redisClient || redis.createClient(
            {
                host: '127.0.0.1',
                port: 6379,
                db: 2
            }
        );


        if(client.constructor.name !== 'RedisClient'){
            throw new Error("redisClient passed not created using the 'redis' module!")
        }


        self = Object.assign(self, {
            client,
            maxAbuseRate: 5
        }, opts)

    }

DRL.prototype.presetValues = function (key, tokens, window) {
        let self = this;

        var windowMS = Number(window) || humanInterval(window);

        if (isNaN(windowMS) || typeof windowMS !== 'number') {
            throw new Error("Window duration must be a number!")
        }

        //add prefix
        key = `DRL:${key}`;

        self = Object.assign(self, {
            key,
            tokens,
            window: windowMS / 1000
        })
    }

DRL.prototype.throttle = function (key, tokens, window) {
    let self = this;

    return new Promise((resolve, reject) => {

        self.presetValues(key, tokens, window)

        self.getKey()
            .then(function (resp) {

                //if no key, then we set key
                if (resp === null) {
                    return self.setKey();
                } else {
                    return self.removeTokens()
                }

            })
            .then(resolve)
            .catch(reject)

    })

}


DRL.prototype.reset = function (key, tokens, window) {
    let self = this;

    self.presetValues(key, tokens, window)

    return self.setKey()

}

DRL.prototype.quit = function () {
    let self = this;
    self.client.quit();
}

DRL.prototype.setKey = function () {
    let self = this;
    return new Promise((resolve, reject) => {

        self.client.multi()
            .set(self.key, self.tokens)
            .expire(self.key, self.window)
            .exec(function (err, resp) {

                if (err) return reject(err);

                resolve({
                    message: "We have reset your rate limit.",
                    tokensRemaining: self.tokens,
                    expiry: moment().add(self.window, 'seconds').toISOString()
                });

            });

    })

}

DRL.prototype.removeTokens = function (tokens) {
    let self = this;
    return new Promise((resolve, reject) => {

        tokens = Number(tokens) || 1;

        self.client.multi()
            .ttl(self.key)
            .incrby(self.key, -1 * tokens)
            .exec(function (err, resp) {

                if (err) return reject(err);

                let [expiry, tokens] = resp;

                // console.log({expiry, tokens});

                if (expiry < 0) {

                    //reset tokens
                    self.client.multi()
                        .set(self.key, self.tokens)
                        .expire(self.key, self.window)
                        .exec(function (err, resp) {

                            if (err) return reject(err);
                            resolve({
                                tokens: self.tokens
                            });

                        });

                }

                //if tokens are finished
                if (tokens < 0) {

                    // console.log(Math.abs(tokens), self.tokens)
                    var msg = 'You have exceeded your rate limit!';

                    let isAbuser = (Math.abs(tokens) / 2 > self.tokens),
                        abuseRate = Math.abs(tokens) / 2 / self.tokens;

                    // console.log({isAbuser, abuseRate})

                    if (isAbuser) {

                        //if AbuseRate > 5, reject anything to do with user till later
                        //this saves us from keeping hitting redis all the time
                        if (abuseRate > (self.maxAbuseRate * 2)) {
                            msg = "ಠ_ಠ";
                        } else {

                            if (abuseRate > self.maxAbuseRate) {

                                abuseRate = abuseRate * (self.maxAbuseRate * 2);

                                msg = "You are banned from accessing this server till later! Cheers!";

                            } else {
                                msg += " Please stop abusing this system or get banned for longer!";
                            }

                            // console.log('Ban!!')
                            self.client.multi()
                                // .set(self.key, 0)
                                .expire(self.key, self.window * 10 * abuseRate)
                                .exec(function (err, resp) {
                                    // console.log(err, resp)

                                })

                        }




                    }


                    let resp = {
                        message: msg,
                        tokensExceeded: tokens,
                        abuseRate,
                        bannedTill: moment().add(expiry, 'seconds').toISOString()
                    }


                    return reject(resp);

                }

                return resolve({
                    message: "You are within your rate limit.",
                    expiry: moment().add(expiry, 'seconds').toISOString(),
                    tokensRemaining: tokens
                });

            });

    })


}


DRL.prototype.getKey = function () {
    let self = this;

    return new Promise((resolve, reject) => {
        self.client.get(self.key, function (err, resp) {
            if (err) return reject(err);

            resolve(resp);

        })
    })

}


module.exports = function (options) {
    return new DRL(options)
};