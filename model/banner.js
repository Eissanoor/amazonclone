const { Schema, mongoose } = require("mongoose");
const productschema = new mongoose.Schema(
    {

        image: String,
        status: Number
    },
    {
        timestamps: true,
    }
);
const banner = new mongoose.model("banner", productschema);
module.exports = banner;
