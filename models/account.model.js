const mongoose = require("mongoose");
const ledgerModel  = require("./ledger.model");


const accountSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
        required: [true,"Account must be associated with a user"],
        index:true
    },
  status: {
    type: String,
    enum: {
        values: ["Active", "Frozen", "Closed"],
        message: "Status can either be Active, Frozen or Closed"
    },
    default: "Active"
},
    currency:{
        type: String,
        required:[true,"Curreny must be set for creating an account"],
        default:"INR"
    }
},{
    timestamps:true
})

accountSchema.index({user:1,status:1});

accountSchema.methods.getBalance  = async function(session= null){
    const balanceData = await ledgerModel.aggregate([
        {$match:{account:this._id}},
        {
            $group:{
                _id: null,
                balance:{
                    $sum:{
                        $cond:[
                            {$eq:["$type","CREDIT"]},
                            "$amount",
                            {$multiply:["$amount",-1]}
                        ]
                    }
                }
            }
        }
    ]).session(session)

    if(balanceData.length === 0){
        return 0;
    }
    return balanceData[0].balance
}

const accountModel = mongoose.model("account",accountSchema);

module.exports = accountModel
