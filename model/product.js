const { Schema, mongoose } = require("mongoose");
const productschema = new mongoose.Schema(
    {
        productname: {
            type: String,
            required: true,
        },
        subcategoryId: { type: Schema.Types.ObjectId, ref: "subcategory", require: true },
        slug: String,
        image: String,
        thumbnails: [String], 
        brands: String,
        hardisk: String,
        cpu: String,
        operatingsysytem: String,
        ram: String,
        asin: String,
        description: String,
        price: Number,
        stock: Number,
        status: Number
    },
    {
        timestamps: true,
    }
);
const product = new mongoose.model("product", productschema);
module.exports = product;
