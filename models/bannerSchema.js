const mongoose = require("mongoose");
const { Schema } = mongoose;

const bannerschema = new Schema ({
    image:{
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true 
    },
    description:{
        type: String,
        required: true
    },
    link:{
        type: String,
        required: true
    },
    startDate:{
        type: Date,
        required: true
    },
    endDate:{
        type: Date,
        required: true
    }
})

const Banner = mongoose.model("Banner", bannerschema)

module.exports = Banner;