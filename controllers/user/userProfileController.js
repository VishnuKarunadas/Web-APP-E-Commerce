
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
    const userId = req.session.user || req.user;
    try {
        if (userId) {
            const user = await User.findById(userId);
            res.render("forget-password",{
                user
            });
        }else{
            const user = null
            res.render("forget-password",{
            user
            });
        }
        

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



const securePassword = async (password) => {
    console.log("-------------------Secure Password ---------------------");
    try {
        const passwordHash = await bcrypt.hash(password, 10); // Fix parameter typo
        console.log("hashedpassword",passwordHash)
        return passwordHash;
    } catch (error) {
        console.error("Error hashing password:", error); // Log the error for debugging
        throw new Error("Password hashing failed"); // Throw the error to handle it properly
    }
};
// const securePassword = async (password) => {
//     try {
//       const passwordHash = await bcrypt.hash(password, 10);
//       return passwordHash;
//     } catch (error) {
//       next(error);
//     }
//   };

const forgetEmailValidation = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user;
       
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });
        const user = findUser;
        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render("forgetPass-otp",{userId,user});
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

const changeUserPassword = async (req, res, next) => {
    console.log("----------------Change User Password----------------");
    try {
        const userId = req.session.user || req.user;

       
        const findUser = await User.findById(userId);
        const user = finduser;
        console.log(findUser)
        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(findUser.email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = findUser.   email;
                res.render("forgetPass-otp",{userId});
                console.log("OTP:", otp);
            } else {
                res.json({ success: false, message: "Failed to send OTP. Please try again" });
            }

        } 
    } catch (error) {
        next(error);
    }
}

const conformCurrentPassword = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user;

        const findUser = await User.findById(userId);
        console.log(findUser);
        const { currentPassword } = req.body;
        console.log(currentPassword);

      
        const passwordMatch = await bcrypt.compare(currentPassword, findUser.password);

        if (!passwordMatch) {
            return res.json({ success: false, message: "Entered Password is wrong" });
        }
        res.json({ success: true, message: "OTP sent!" });

    } catch (error) {
        next(error);
    }
};


const verifyOtp = async (req, res, next) => {
    console.log("------------verify Otp-----------------");
    try {
        const { otp } = req.body;
        console.log("otp from user", otp);
        console.log("otp from session", req.session.otp);
        
        if (String(req.session.otp) === String(otp)) {
            res.json({ success: true, message: "OTP verified!" });
        } else {
            res.json({ success: false, message: "Invalid OTP. Try again." });
        }
    } catch (error) {
        next(error);
    }
};

const updatePassword = async (req, res, next) => {
    console.log("----------------update password---------------")
    try {
        const userId = req.session.user || req.user;

        const findUser = await User.findById(userId);
        console.log(findUser);
        const {newPassword, confirmPassword } = req.body;
        
        console.log(findUser.email)
        if(newPassword === confirmPassword) {
            console.log("New Passwords:", newPassword, confirmPassword);
            const passwordHash = await securePassword(newPassword);
            console.log("New Passwords hashed:", passwordHash);
            await User.updateOne(
                { email: findUser.email },
                {$set: { password: passwordHash}})
                res.json({ success: true, message: "Password updated successfully!" });
            }else{
                res.json({ success: true, message: "Password updated failed!" });
            }

     

    } catch (error) {
        next(error);
    }
};


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
console.log("----------------resnd otp-----------------")
    try{

        const userId = req.session.user || req.user;

       
        const userData = await User.findById(userId)
            .populate('address')  
            .exec();

    const otp = generateOtp();
    req.session.userOtp = otp;
    const email = req.session.email || userData.email ;
    console.log(userData)
    console.log(email)
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

const postNewPassword = async (req, res, next) => {
    console.log("-----Pst new password--------------")
    try {
        const {newPass1, newPass2} = req.body;
        const email = req.session.email;
        if(newPass1 === newPass2) {
            console.log("New Passwords:", newPass1, newPass2);
            const passwordHash = await securePassword(newPass1);
            console.log("New Passwords hashed:", passwordHash);
            await User.updateOne(
                { email: email },
                {$set: { password: passwordHash}}
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
    changeUserPassword,
    updatePassword,
    verifyOtp,
    conformCurrentPassword,

}