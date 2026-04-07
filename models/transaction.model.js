const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must be associated with a from account"]
    },
      toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must be associated with a to account"]
    },
    status:{
          type: String,
        enum:{
            values:["Pending","Completed","Failed","Reversed"],
            message:"Status can be either pending,completed,failed or reversed"
        },
        default:"Pending"
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating an transaction"],
        min:[0,"amount cannot be negative"]
    },
    idempotencyKey:{
        type: String,
        required:[true,"idmKey is required for creating an transaction"],
        index:true,
        unique:true

    }
},{
    timestamps:true
})


const transactionModel = mongoose.model("transaction",transactionSchema);

module.exports  = transactionModel;