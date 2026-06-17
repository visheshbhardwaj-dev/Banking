const emailQueue =
 require("../queues/email.queue");

async function
SendTransactionEmail(
  fromUserAccount,
  toUserAccount,
  amount
) {

  try {

    console.log(
      "Queueing transaction emails..."
    );

    await emailQueue.add(
      "debit-email",
      {
        to:
          fromUserAccount
            .user.email,

        subject:
          "Transaction Completed!",

        text:
          "Money sent securely",

        html:
          `<p>
            ₹${amount}
            debited from
            your A/C
          </p>`
      },
      {
        attempts: 3,
        backoff: {
          type:
            "exponential",
          delay: 2000
        }
      }
    );

    console.log(
      "Debit email queued"
    );

    await emailQueue.add(
      "credit-email",
      {
        to:
          toUserAccount
            .user.email,

        subject:
          "Money Received!",

        text:
          "Money received",

        html:
          `<p>
            ₹${amount}
            credited to
            your A/C
          </p>`
      },
      {
        attempts: 3,
        backoff: {
          type:
            "exponential",
          delay: 2000
        }
      }
    );

    console.log(
      "Credit email queued"
    );

  } catch (err) {

    console.log(
      "EMAIL QUEUE ERROR:",
      err.message
    );

    throw err;
  }
}

module.exports =
 SendTransactionEmail;