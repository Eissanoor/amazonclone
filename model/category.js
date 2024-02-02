const mongoose = require("mongoose");
const categoryschema = new mongoose.Schema(
    {
        categoryname: {
            type: String,
            required: true,
        },
        status: Number
    },
    {
        timestamps: true,
    }
);
const category = new mongoose.model("category", categoryschema);
module.exports = category;
