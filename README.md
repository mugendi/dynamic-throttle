# Dynamically set application rate limits

There are many rate limiters out there and almost all work as follows:

**Step One: Initialization**. Here, you set a rate Limit

**Step Two: Rate Limiting**. Then you start consuming tokens with every call.

While this works, it means that you cannot change rate limits after initialization. You cannot build an app that dynamically sets its own rate limits depending of traffic as well as other parameters.

While this is scenario is difficult to encounter, we happened to build an app that monitors peoples browsing habits and dynamically sets rate limits. In other words, we influential users to drive a bigger traffic torrent to our app than other users. 

## Usage 
First, ```yarn add dynamic-throttle```


```javascript

const Throttle = require('dynamic-throttle'),
    //initialize
    throttler = Throttle({/*options*/}),
    //key used to throttle hits
    key = 'test key',
    //how many tokens per window
    tokens = 500,
    //duration before ones tokens are renewed
    window = 'minute'; 
    

  throttler.throttle(key, tokens, window)
        .then(function (resp) {
            //Execute your code here
        })
        .catch(function (resp) {
            //Rate Limit exceeded. Stop right here
        })

```

## API

## Initialization
The first step is to initialize your rate limiter. Unlike other limiters, this process exists mostly to help you properly initialize your Redis instance.

```javascript

    Throttle({
        redisClient :  redis.createClient() // a redis instance
    })

```


### ```.throttle(key, tokens, window)```
This is the main method, and likely the only you will use.

It checks or sets new token sessions and ensures tokens are consumed with each call. By having all this functionality in one function, we enable you to dynamically call only ***this one function*** for all your throttling needs. 

*It is a setter, getter & token consumer all in one!*

### ```.reset(key, tokens, window)```
Use this function if you need to immediately (hard) reset tokens for any key.

**NOTE:** If you dynamically set new token values, the new value is only applied in the next window session. This is because we have to wait for key expiration from redis in order to set the new values.

However, if you would like the changes to apply immediately, use **.reset()**.

### ```.quit()```
Quit the redis session and close all connections. Normally, you would only call this if exiting application.



