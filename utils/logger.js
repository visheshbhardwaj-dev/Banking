const pino = require("pino");

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: isProd ? "info" : "debug",

  base: {
    service: "bank-app",
  },

  // 👇 Add this
  redact: [
    "req.headers.cookie",
    "req.headers.authorization",
  ],

  // 👇 And this
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },

    err(err) {
      return {
        message: err.message,
        stack: err.stack,
      };
    },
  },

  transport: !isProd
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      }
    : undefined,
});

module.exports = logger;