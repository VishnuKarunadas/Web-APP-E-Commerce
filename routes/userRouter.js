const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController")
const passport = require('../config/passport')
const productViewController = require('../controllers/user/productViewController');


router.get("/pageNotFound",userController.pageNotFound)

// sign up mgnt
router.get('/',userController.loadHomepage)
router.get('/signup',userController.loadSignUp)
router.post('/signup',userController.SignUp)
router.post("/verify-otp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

router.get("/login",userController.loadLogin);
router.post("/login",userController.login);
router.get('/logout',userController.logout)


//google auth
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
});

// user product view 
router.get('/product/:productId', productViewController.loadSingleProduct);









module.exports =router;