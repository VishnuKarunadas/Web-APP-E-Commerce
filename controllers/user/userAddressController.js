const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("crypto")

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");



const userAddress = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user;

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const user = await User.findById(userId).populate('address').exec();

        if (!user || user.address.length === 0) {
            console.log('No addresses found');
            return res.render('user-address', { 
                address: [], 
                currentPage: 1, 
                totalPages: 1 
            });
        }

        // Fetch all addresses associated with the user
        const addresses = await Address.find({ _id: { $in: user.address } }).sort({ createdAt: -1 });

        // Render the page with all addresses without pagination
        res.render('user-address', {
            address: addresses,
            currentPage: 1, // Can remove this since pagination is no longer used
            totalPages: 1,  // Can remove this as well
            totalAddress: addresses.length
        });
    } catch (error) {
        next(error);
    }
};



const addNewAddress = async (req,res,next) => {

    try {
        
        res.render("add-address");

    } catch (error) {
        next(error)
    }


}

const updateNewAddress = async (req, res, next) => {
    const { house, place, city, state, pin, landMark, contactNo } = req.body;

    const userId = req.session.user || req.user;

    try {
        
        const existingAddress = await Address.findOne({ house, pin });
        if (existingAddress) {
            return res.status(400).json({ error: "Address already exists" });
        }

        
        const newAddress = new Address({
            house,
            place,
            city,
            state,
            pin,
            landMark,
            contactNo
        });

        await newAddress.save();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.address.push(newAddress._id);  
        await user.save();  

        return res.json({ message: "Address added successfully" });
    } catch (error) {
        next(error);
    }
};


const getEditAddress = async (req, res, next) => {
    const userId = req.session.user || req.user;

    try {
        const id = req.params.id; 

        const user = await User.findById(userId).populate('address').exec();

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

       
        const address = user.address.find(addr => addr._id.toString() === id);

        if (!address) {
            return res.status(404).send("Address not found");
        }

        
        res.render("edit-address", { address: address });
    } catch (error) {
        next(error);
    }
};




const editAddress = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { house, place, city, state, pin, landMark, contactNo } = req.body;

        
        const existingAddress = await Address.findById(id);


        
        if (!existingAddress) {
            return res.status(400).json({ error: "Address does not exist" });
        }

       
        const updatedAddress = await Address.findByIdAndUpdate(id, {
            house: house,
            place: place,
            city: city,
            state: state,
            pin: pin,
            landMark: landMark,
            contactNo: contactNo
        }, { new: true });


       
        if (updatedAddress) {
            return res.status(200).json({ success: "Address updated successfully" });
        } else {
            return res.status(404).json({ error: "Address not found" });
        }
    } catch (error) {
        next(error);
    }
};



const deleteAddress = async (req, res) => {
    try {
        const id = req.query.id;

       
        const deletedAddress = await Address.deleteOne({ _id: id });

        if (deletedAddress.deletedCount > 0) {
            res.json({ 
                status: true, 
                message: `Address successfully deleted` 
            });
        } else {
            res.status(404).json({ status: false, message: 'Address not found' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};



module.exports = {
    userAddress,
    addNewAddress,
    updateNewAddress,
    deleteAddress,
    getEditAddress,
    editAddress

}
