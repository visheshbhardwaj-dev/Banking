const mongoose  = require("mongoose");


const ledgerSchema = new mongoose.Schema({
    account:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"account",
      required:[true,"Ledger must be associated with a account"],
      index:true,
      immutable:true
    },
    amount:{
        type: Number,
        required:[true,"Ledger must have an amount"],
        immutable:true
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true,"ledger must be associated with a transaction"],
        index:true,
        immutable:true
    },
    type:{
        type:String,
        enum:{
            values:["CREDIT","DEBIT"],
            message:"type can either be credit or debit"
        },
        required:[true,"ledger entry must have a type"],
        immutable:true
    }
    
})


function preventLedgerMod(){
    throw new Error("Ledger entries are immutable hence cannot be updated,deleted or removed")
}


ledgerSchema.pre('findOneAndUpdate',preventLedgerMod);
ledgerSchema.pre('updateOne',preventLedgerMod);
ledgerSchema.pre('deleteOne',preventLedgerMod);
ledgerSchema.pre('remove',preventLedgerMod);
ledgerSchema.pre('deleteMany',preventLedgerMod);
ledgerSchema.pre('updateMany',preventLedgerMod);
ledgerSchema.pre('findOneAndDelete',preventLedgerMod);
ledgerSchema.pre('findOneAndReplace',preventLedgerMod);


const ledgerModel = mongoose.model('ledger',ledgerSchema);

module.exports= ledgerModel; 