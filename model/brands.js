const mongoose = require("mongoose");
const brandsschema = new mongoose.Schema(
    {
        brandname: {
            type: String,
            required: true,
        },
        status: Number
    },
    {
        timestamps: true,
    }
);
const brands = new mongoose.model("brands", brandsschema);
module.exports = brands;
