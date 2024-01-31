const mongoose = require("mongoose");
const hardiskschema = new mongoose.Schema(
    {
        hardiskname: {
            type: String,
            required: true,
        },
        status: Number
    },
    {
        timestamps: true,
    }
);
const hardisk = new mongoose.model("hardisk", hardiskschema);
module.exports = hardisk;
