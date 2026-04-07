const accountModel = require("../models/account.model")


async function createAccount(req,res) {
    const user = req.user;
    
    const account = await accountModel.create({
        user:user._id
    })

    await account.populate("user", "name")

    res.status(201).json({
        userName: user.name,
        account
    })
    
}

async function getAllAccounts(req,res){
 const currUser  = req.user;
    const accounts = await accountModel.find({
        user:currUser._id
    })

    if(!accounts){
        return res.status(400).json({
            message:"Account not found"
        })
    }
    res.status(200).json({
        accounts
    })
}


async function getAcBalance(req,res){
    const {accountId}= req.params

    const account = await accountModel.findOne({
        _id: accountId,
        user:req.user._id
    })

    if(!account){
        return res.status(404).json({
            message:"account not found"
        })
    }
    const balance  = await account.getBalance()

    res.status(200).json({
        balance
    })


}


module.exports={
    createAccount,
    getAllAccounts,
    getAcBalance
}
