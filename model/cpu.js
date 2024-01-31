const mongoose = require("mongoose");
const cpuschema = new mongoose.Schema(
    {
        cpuname: {
            type: String,
            required: true,
        },
        status: Number
    },
    {
        timestamps: true,
    }
);
const cpu = new mongoose.model("cpu", cpuschema);
module.exports = cpu;
