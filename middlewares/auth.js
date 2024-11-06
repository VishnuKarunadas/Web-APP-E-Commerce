const User = require('../models/userSchema');


const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{if(data && !data.isBlocked){
            next();
        }else{
            res.redirect('/login')
        }})
        .catch(error=>{
            console.log("Error in user auth middleware",error);
            res.status(500).send("Internal Server error");
        })
    }
}


const adminAuth = (req, res, next) => {

    if(req.session.admin){
    User.findOne({ role: "admin" })
    
        .then(data => {
            if (data) {
                next();
            } else {
                res.redirect("/admin/login");
            }
        })
        .catch(error => {
            console.log("Error in adminAuth middleware", error);
            res.status(500).send("Internal Server Error");
        });
} else {
    res.redirect("/admin/login");
}
}


module.exports ={
    adminAuth,
    userAuth,
}