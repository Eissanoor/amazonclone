const mongoose = require("mongoose");
const ramschema = new mongoose.Schema(
    {
        name: String,
        zip_code_start: Number,
        abbreviation:String,
    },
    {
        timestamps: true,
    }
);
const state = new mongoose.model("state", ramschema);
module.exports = state;
