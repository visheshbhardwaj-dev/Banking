const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");
const userModel = require("../models/user.model");

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  req.log.info({
    action: "TRANSFER_REQUEST_RECEIVED",
    fromAccount,
    toAccount,
    amount,
  });

  //1.Validate Request
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    req.log.warn({
      action: "VALIDATION_FAILED",
      reason: "Missing required fields",
    });
    return res.status(400).json({
      message: "Required fields missing",
    });
  }

  if (amount < 0) {
    return res.status(400).json({
      message: "Invalid amount",
    });
  }

  const fromUserAccount = await accountModel
    .findOne({ _id: fromAccount })
    .populate("user");

  const toUserAccount = await accountModel
    .findOne({ _id: toAccount })
    .populate("user");

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid from or to account",
    });
  }

  if (fromUserAccount.user._id.toString() !== req.user._id.toString()) {
    req.log.warn({
      action: "UNAUTHORIZED_ACCOUNT_ACCESS",
      userId: req.user._id,
      fromAccount,
    });
    return res.status(403).json({
      message: "You can only use your own account",
    });
  }

  // 2.Validate idempotency key
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    req.log.info({
      action: "IDEMPOTENCY_HIT",
      status: isTransactionAlreadyExists.status,
    });

    if (isTransactionAlreadyExists.status === "Completed") {
      return res.status(200).json({
        message: "Transaction already processed",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "Pending") {
      return res.status(200).json({
        message: "Transaction is still processing",
      });
    }

    if (isTransactionAlreadyExists.status === "Failed") {
      return res.status(500).json({
        message: "Transaction failed!Please try again!",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "Reversed") {
      return res.status(500).json({
        message: "Transaction reversed!Please try again!",
        transaction: isTransactionAlreadyExists,
      });
    }
  }

  // 3.Check account status
  if (
    fromUserAccount.status !== "Active" ||
    toUserAccount.status !== "Active"
  ) {
    return res.status(400).json({
      message:
        "both sender and receiver's account should be active to process a transaction",
    });
  }

  //5. Create transaction(PENDING)
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    req.log.info({
      action: "TRANSACTION_STARTED",
    });

    const balance = await fromUserAccount.getBalance(session);

    req.log.info({
      action: "BALANCE_FETCHED",
      balance,
    });

    if (balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Insufficient balance..Current balance: ${balance}`,
      });
    }

    const [transaction] = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "Pending",
        },
      ],
      { session }
    );

    const txnLogger = req.log.child({
      transactionId: transaction._id.toString(),
    });

    txnLogger.info({
      action: "TRANSACTION_RECORD_CREATED",
    });

    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session }
    );

    txnLogger.info({
      action: "DEBIT LEDGER CREATED",
      account: fromAccount,
      amount: amount,
    });

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }
    );

    txnLogger.info({
      action: "CREDIT LDGER CREATED",
      account: toAccount,
      amount: amount,
    });

    const updatedBalance = await fromUserAccount.getBalance(session);

    if (updatedBalance !== balance - amount) {
      txnLogger.error({
        action: "RACE_CONDITION_DETECTED",
        expected: balance - amount,
        actual: updatedBalance,
      });
      throw new Error("Race condition detected");
    }

    await transactionModel.updateOne(
      { _id: transaction._id },
      { status: "Completed" },
      { session }
    );

    txnLogger.info({
      action: "TRANSACTION_COMPLETED",
    });

    txnLogger.info({
  action: "TRANSACTION_SUMMARY",
  from: fromAccount,
  to: toAccount,
  amount,
  transactionId: transaction._id,
});

    await session.commitTransaction();

    sendEmail(
      fromUserAccount.user.email,
      "Transaction Completed!",
      "Money sent securely",
      `<p>${amount} has been debited from your A/C</p>`
    );

    sendEmail(
      toUserAccount.user.email,
      "Money Received!",
      "You got money",
      `<p>${amount} has been credited to your A/C</p>`
    );

    return res.status(201).json({
      message: "Transaction successful",
      transaction,
    });
  } catch (err) {
    await session.abortTransaction();

    req.log.error({
      action: "TRANSACTION_FAILED",
      error: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      message: "Transaction failed",
    });
  } finally {
    session.endSession();

    req.log.info({
      action: "SESSION_ENDED",
    });
  }
}

async function createInitialFunds(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Required fields missing",
    });
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount) {
    return res.status(400).json({
      message: " account doesn't exists",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System user account not found",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [transaction] = await transactionModel.create(
      [
        {
          fromAccount: fromUserAccount._id,
          toAccount: toAccount,
          amount,
          idempotencyKey,
          status: "Pending",
        },
      ],
      { session }
    );

    await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session }
    );

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }
    );

    await transactionModel.updateOne(
      { _id: transaction._id },
      { status: "Completed" },
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      message: "Initial funds added successfully",
      transaction,
    });
  } catch (err) {
    await session.abortTransaction();
    console.log(err);

    return res.status(500).json({
      message: "Transaction failed!",
    });
  } finally {
    session.endSession();
  }
}

module.exports = {
  createTransaction,
  createInitialFunds,
};