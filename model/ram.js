const mongoose = require("mongoose");
const ramschema = new mongoose.Schema(
    {
        ramname: {
            type: String,
            required: true,
        },
        status: Number
    },
    {
        timestamps: true,
    }
);
const ram = new mongoose.model("ram", ramschema);
module.exports = ram;
