const redis = require('ioredis');




const redisConnection =  new redis({
     host:'redis',
    port:6379,
     maxRetriesPerRequest: null
});

module.exports = redisConnection;