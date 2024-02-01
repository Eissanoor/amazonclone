const mongoose = require("mongoose");
const operationschema = new mongoose.Schema(
    {
        operatingname: {
            type: String,
            required: true,
        },
        status: Number
    },
    {
        timestamps: true,
    }
);
const operatingsystem = new mongoose.model("operatingsystem", operationschema);
module.exports = operatingsystem;
