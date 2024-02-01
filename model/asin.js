const mongoose = require("mongoose");
const asinschema = new mongoose.Schema(
    {
        asinname: {
            type: String,
            required: true,
        },
        status: Number
    },
    {
        timestamps: true,
    }
);
const asin = new mongoose.model("asin", asinschema);
module.exports = asin;
