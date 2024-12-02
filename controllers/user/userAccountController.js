const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("crypto")

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")


const userAccount = async (req,res,next) => {

    try {
        const userId = req.session.user || req.user;
        res.render("user-account-edit", {userId});


    } catch (error) {
        next(error)
    }

}


const editUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, gender, email, phone } = req.body;

       
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(400).json({ error: "User not found" });
        }
       
        // if (existingUser.googleId) {
        //     console.log("habibi")
        //     return res.status(400).json({ message: "You can update contact details from Google or update them in the address field." });
            
        // }
        console.log(phone)
       
        const phoneNumber = await User.findOne({ phone:phone });
        console.log(phoneNumber)

        if (phoneNumber) {
            console.log("habibi1");
            return res.status(400).json({ message: "phone number already exists." });
        }
        

       
        const updatedUser = await User.findByIdAndUpdate(id, {
            name,
            gender,
            email,
            phone,
        }, { new: true });

        console.log("success")

        if (updatedUser) {
            return res.status(200).json({ success: "Details updated successfully." });
        } else {
            return res.status(404).json({ error: "User not found." });
        }
    } catch (error) {
        console.error("Error updating user:", error);
        next(error);
    }
};




// const deleteAccount = async (req, res, next) => {
//     try {
//         const userId = req.session.user || req.user;


//         const updateUser = await User.findByIdAndUpdate(userId, {
//             $unset: {
//                 name: "",
//                 email: "",
//                 phone: "",
//                 addresses: "", 
//                 password: ""   
//             },
//            isActive: "deleted"
//         });

//         if (updateUser) {
        
//             req.session.destroy(err => {
//                 if (err) {
//                     return next(err);
//                 }
            
//                 res.redirect("/signup");
//             });
//         } else {
//             res.status(404).json({ status: false, message: 'User not found' });
//         }
//     } catch (error) {
//         next(error);
//     }
// };





module.exports = {
    userAccount,
    editUser,
}