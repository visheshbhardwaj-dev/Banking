const redisConnection = require("../src/config/redis");


const {Queue}  = require("bullmq")
  

const emailQueue =  new Queue(
    "email-Queue",
    {connection:redisConnection}
);


module.exports =  emailQueue