const joi = require("joi");

const transactionJoiSchema = joi.object({
  fromAccount: joi.string().required(),
  toAccount: joi.string().required(),
  amount: joi.number().positive().required(),
  idempotencyKey: joi.string().required(),
});

const userJoiSchema = joi.object({
  email: joi.string().trim().lowercase().email().required(),
  name: joi.string().trim().min(2).max(50).required(),
  password: joi.string().min(6).required(),
});


module.exports = {
    transactionJoiSchema,
    userJoiSchema

}