const { Schema, mongoose } = require("mongoose");
const subcategoryschema = new mongoose.Schema(
    {
        subcategoryname: {
            type: String,
            required: true,
        },
        categoryId: { type: Schema.Types.ObjectId, ref: "category", require: true },
        status: Number,
        image:String
    },
    {
        timestamps: true,
    }
);
const subcategory = new mongoose.model("subcategory", subcategoryschema);
module.exports = subcategory;
