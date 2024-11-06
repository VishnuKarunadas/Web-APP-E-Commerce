const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const userSchema = new Schema({
    userId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        sparse:true
    },
    phone: {
        type: String,
        required: false,
        unique:true,
        sparse:true,//null value for google auth-
    },
    googleId: {
        type: String,
        required: false,
        unique:true,
        sparse:true
    },
    password: {
        type: String, 
        required: false
    },
    gender:{
        type:String,
        required:false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isActive:{
        type: String,
        enum: ["active","deactivated","deleted"],
        default:"active",
        required:false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["user","admin",'owner'],
        default:"user",
        required:false
    },
    address: [
        { type: Schema.Types.ObjectId, 
        ref: 'Address' 
    }],

    wishlist: {
        type:Schema.Types.ObjectId,
        ref:'Wishlist'
    },
    cart: { 
        type: Schema.Types.ObjectId, 
        ref: 'Cart' 
    }, 
    
    wallet: {
        type: Schema.Types.ObjectId,
        ref:'Wallet'
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    referralCode: {
        type: String,
        default: () => uuidv4().split('-')[0],
        unique: true,
        required : false
    },
    referralLink: {
        type: String,
        unique: true,
        required: false,
        default: function() {
            return `http://localhost:3000/signup/${this.referralCode}`;
        }
    },
    referrals: [{ 
        type: Schema.Types.ObjectId,
        ref: 'Referral'
    }],
    redeemed: {
        type: Boolean
    },
    redeemedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category"
        },
        brand: {
            type: String
        },
        searchOn: {
            type: Date,
            default: Date.now
        }
    }]
});


const User = mongoose.model("User", userSchema);
module.exports = User;
