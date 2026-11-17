

const express = require('express');
const cookieParser  = require("cookie-parser")
const pinoHttp = require("pino-http")
const logger = require("../utils/logger")
const authRouter = require("../routes/auth.routes")
const accountRouter = require("../routes/account.routes");
const transactionRouter  = require("../routes/transaction.routes");
const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const {limiter,authLimiter,transactionLimiter} = require("../utils/rateLimit")

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use(express.json())
app.use(cookieParser());
app.use(pinoHttp({logger}))

// app.use(limiter)
app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transaction",transactionRouter);


module.exports = app
