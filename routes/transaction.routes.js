const {Router}  = require('express');

const {authMiddleware,authSystemMiddleware}= require("../middleware/auth.middleware");
const {createTransaction,createInitialFunds} = require("../controllers/transaction.controller")

const transactionRouter = Router();


transactionRouter.post("/",authMiddleware,createTransaction);



transactionRouter.post("/system/initialfunds",authSystemMiddleware,createInitialFunds);



module.exports = transactionRouter


