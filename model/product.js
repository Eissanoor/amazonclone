const { Schema, mongoose } = require("mongoose");
const productschema = new mongoose.Schema(
    {
        productname: {
            type: String,
            required: true,
        },
        categoryId: { type: Schema.Types.ObjectId, ref: "category", require: true },
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
