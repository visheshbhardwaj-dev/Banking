const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");


async function authMiddleware(req,res,next) {
 
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
       return res.status(401).json({
            message:"INVALID TOKEN"
        })
    }
    try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
     
    const user = await userModel.findById(decoded.id);
    if(!user){
       return res.status(401).json({
            message:"INVALID USER"
        })
    }
    req.user = user
    return next();
}catch(err){
    console.log(err)
   return res.status(401).json({
        message:"Unauthorized access,token is invalid"
    })
    
}
}

async function authSystemMiddleware(req,res,next) {

    
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
       return res.status(401).json({
            message:"INVALID TOKEN"
        })
    }
try{    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.id).select("+systemUser");

    if(!user.systemUser){
        return res.status(403).json({
            message:"Access forbidden!!"
        })
    }

    req.user= user;
    return next();

}
catch(err){
    return res.status(401).json({
        message:"INVALID TOKEN"
    })
}

}

module.exports={
    authMiddleware,
    authSystemMiddleware
}