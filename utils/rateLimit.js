const rateLimit = require("express-rate-limit");




const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,// max 100 requests per IP
  
  message: {
    message: "Too many requests, try again later"
  }
});






const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 login attempts

  message: { message: "Too many login attempts" }
});





const transactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // 5 transfers per minute
 
  message: { message: "Too many transactions" }
});


module.exports = {
    limiter,
    authLimiter,
    transactionLimiter
}