
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("crypto")

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const address = require("../../models/addressSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema")


function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString(); 
}

const forgetPasswordPage = async (req, res, next) => {

    try {
        
        res.render("forget-password");

    } catch (error) {
        next(error);
    }


}



function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString(); 
}

const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            port: 587, 
            secure: false, 
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Your OTP for password reset",
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP: ${otp}</h4></b>`
        };

        const info = await transporter.sendMail(mailOptions); 
        console.log("Email sent:", info.messageId);
        return true;

    } catch (error) {
        console.log("Error sending email", error);
        return false;
    }
}

const securePassword = async (passsword) => {
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash;
    } catch (error) {
        
    }
}


const forgetEmailValidation = async (req, res, next) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });
        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render("forgetPass-otp");
                console.log("OTP:", otp);
            } else {
                res.json({ success: false, message: "Failed to send OTP. Please try again" });
            }

        } else {
            res.render("forget-password", {
                message: "User with this email does not exist"
            });
        }
    } catch (error) {
        next(error);
    }
}

const verifyForgetPassOtp = async (req, res, next) => {

    try {

        const enterdOtp = req.body.otp;
        if(enterdOtp === req.session.userOtp) {
            res.json({success:true, redirectUrl:"/reset-password"});
        } else {
            res.json({success:false, message:"OTP not matching"});
        }

        
    } catch (error) {
        next(error);
    }


}

const getResetPassPage = async (req, res, next) =>{

    try {
        res.render("reset-password")
    } catch (error) {
        next(error)
    }
}

const resendOtp = async (req, res, next) =>{

    try{

    const otp = generateOtp();
    req.session.userOtp = otp;
    const email = req.session.email;
    console.log("Resending OTP to email:", email);
    const  emailSent = await sendVerificationEmail(email,otp);
    if(emailSent){
        console.log("Resend OTP:",otp);
        res.status(200).json({
            success:true,
            message:"Resend OTP Successfull"
        })
    }

    } catch (error) {
        next(error)
    }
}

const postNewPassword = async (req, res, next) =>{
    try {
        const {newPass1, newPass2} = req.body;
        const email = req.session.email;
        if(newPass1 === newPass2) {
            const passwordHash = await securePassword(newPass1);
            await User.updateOne(
                { email:email },
                {$set:{password:passwordHash}}
            )
            res.redirect("/login");
        } else {
            res.render("reset-password", {message:"Passwords do not match"});
        }
    } catch(error){
        next(error)
    }
}


const userProfile = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user;

       
        const userData = await User.findById(userId)
            .populate('address')  
            .exec();

        
        const firstAddress = userData.address.length > 0 ? userData.address[0] : null;

        
        const orders = await Order.find({ user: userId }).exec();

       
        const pendingOrders = orders.filter(order => order.status === 'Pending');
        const completedOrders = orders.filter(order => order.status === 'Delivered');
        const pendingCount = pendingOrders.length;
        const completedCount = completedOrders.length;
        const totalOrders = orders.length; 

       
        if (res.locals.user) {
            return res.render("user-profile", {
                user: res.locals.user,
                firstAddress,
                pendingCount,
                completedCount,
                totalOrders
            });
        } else {
            return res.render("login");
        }
    } catch (error) {
        console.log("Profile page not found:", error);
        next(error);
    }
};


module.exports = {
    userProfile,
    forgetPasswordPage,
    forgetEmailValidation,
    verifyForgetPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,

}