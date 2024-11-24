const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Cart = require("../../models/cartSchema");
const { cart } = require("./userCartController");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema")
const Coupon = require("../../models/couponSchema")


const myCoupons = async (req, res, next) => {
    try {
        // Filter out coupons with 'Inactive' status
        const coupons = await Coupon.find({ status: { $ne: "Inactive" } }).exec();
        return res.render("my-coupon", { coupons });
    } catch (error) {
        next(error);
    }
};



module.exports = {

    myCoupons

}