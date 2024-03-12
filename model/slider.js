const { Schema, mongoose } = require("mongoose");
const productschema = new mongoose.Schema(
    {
        
        image: String,
       status:Number
    },
    {
        timestamps: true,
    }
);
const slider = new mongoose.model("slider", productschema);
module.exports = slider;
