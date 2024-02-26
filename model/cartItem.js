const { Schema, mongoose } = require("mongoose");
const productschema = new mongoose.Schema(
    {
       
        productId: { type: Schema.Types.ObjectId, ref: "product", require: true },
        userId: { type: Schema.Types.ObjectId, ref: "userauth", require: true },
        quantity: Number,
        status:String
      
    },
    {
        timestamps: true,
    }
);
const cartitem = new mongoose.model("cartitem", productschema);
module.exports = cartitem;
