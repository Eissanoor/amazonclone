const mongoose = require("mongoose");
const categoryschema = new mongoose.Schema(
    {
        categoryname: {
            type: String,
            required: true,
        },
        status: Number,
        image:String
    },
    {
        timestamps: true,
    }
);
const category = new mongoose.model("category", categoryschema);
module.exports = category;
