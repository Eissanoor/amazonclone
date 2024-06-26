const express = require("express");
const router = new express.Router();
const { ObjectId } = require("mongodb");
const bodyparser = require("body-parser");
const nodemailer = require("nodemailer");
const validator = require("validator");
const cron = require("node-cron");
const path = require("path");
const slugify = require("slugify");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const multer = require("multer");
const auth = require("../middleware/auth");
const adminauth = require("../model/adminauth");
const brands = require("../model/brands");
const hardisk = require("../model/hardisk");
const operatingsystem = require("../model/operationSystem");
const ram = require("../model/ram");
const cpu = require("../model/cpu");
const asin = require("../model/asin");
const category = require("../model/category");
const subcategory = require("../model/subcategory");
const product = require("../model/product");
const userauth = require("../model/userauth");
const emailvarify = require("../model/emailotp");
const cartitem = require("../model/cartItem");
const state = require("../model/state");
const slider = require("../model/slider");
const banner = require("../model/banner");
const { profile } = require("console");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
var dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
require("../database/db");
router.use(cors());
router.use(cookieparser());
router.use(bodyparser.urlencoded({ extended: true }));
router.use(express.urlencoded({ extended: false }));
router.use(bodyparser.json());
router.use(express.json());
const mailgun = require("mailgun-js");
const mailGun = process.env.mailGun;
const DOMAIN = mailGun;
const Email_otp_pass = process.env.Email_otp_pass;
const C_cloud_name = process.env.C_cloud_name;
const C_api_key = process.env.C_api_key;
const C_api_secret = process.env.C_api_secret;
const MailGun_api_key = process.env.MailGun_api_key;
cloudinary.config({
  cloud_name: C_cloud_name,
  api_key: C_api_key,
  api_secret: C_api_secret,
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.use("/ProfileImage", express.static("public/upload"));
router.use("/image", express.static("public/upload"));
router.use("/categoryThumbnail", express.static("public/upload"));
router.get("/", (req, res) => {
  res.status(201).json({
    status: 201,
    message: "server is running",
    data: null,
  });
});
router.post("/adminsignup", async (req, res) => {
  let qdate = new Date();
  let date = qdate.toDateString();
  let Id = Math.floor(Math.random() * 10000000) + 1;
  let email = req.body.email;
  const mail = await adminauth.findOne({ email: email });
  if (mail) {
    res
      .status(404)
      .json({ status: 404, message: "email already present", data: null });
  }
  try {
    const registerEmp = new adminauth({
      Id: Id,
      password: req.body.password,
      email: req.body.email,
      date: date,
      ProfileImage: null,
      address: null,
      Phone: null,
      isVarified: false,
      isNewUser: true,
    });
    const registered = await registerEmp.save();
    const data = await adminauth
      .findOne({ email: email })
      .select({ _id: 1, email: 1 });
    res.status(201).json({
      status: 201,
      message: "adminauth has been Created",
      data: data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ status: 400, message: "not found", data: null });
  }
});
router.post("/adminLogin", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000;
    const expirationTime = new Date().getTime() + oneMonthInMillis;
    const useremail = await adminauth.findOne({ email: email });
    const ismatch = await bcrypt.compare(password, useremail.password);

    if (!useremail || !password) {
      res.status(400).json({
        status: 400,
        message: "Enter Correct email or password",
        data: null,
      });
    } else if (ismatch) {
      const getmens = await adminauth.findOneAndUpdate(
        { email: email },
        { $set: { expireIn: expirationTime } },
        { new: true }
      );
      const token = await useremail.generateAuthToken();
      res.cookie("jwt", token, { httpOnly: true });
      res.status(200).json({
        status: 200,
        message: "Login Successfully",
        data: {
          _id: useremail._id,
          isVerified: useremail.isVarified,
          isNewUser: useremail.isNewUser,
          accessToken: token,
        },
      });
    } else {
      res
        .status(404)
        .json({ status: 400, message: "Invalid Password", data: null });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 400, message: "invalid email", data: null });
  }
});
router.post("/add-brands", async (req, res) => {
  try {
    const brandname = req.body.brandname;
    const status = req.body.status;
    const itemNameexist = await brands.findOne({ brandname: brandname });
    if (!itemNameexist) {
      const MenuEmp = new brands({
        brandname: req.body.brandname,
        status: status,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "brands has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "brands name already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-brand", async (req, res) => {
  try {
    const brand = await brands.find();

    res.status(200).json({
      status: 200,
      message: "Brand found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid brand ID",
      data: null,
    });
  }
});
router.get("/get-brandbyid/:id", async (req, res) => {
  try {
    const brandId = req.params.id;

    const brand = await brands.findById(brandId);

    if (brand) {
      res.status(200).json({
        status: 200,
        message: "Brand found",
        data: brand,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Brand not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid brand ID",
      data: null,
    });
  }
});
router.put("/update-brand/:id", async (req, res) => {
  try {
    const brandId = req.params.id;
    const { brandname, status } = req.body;

    const existingBrand = await brands.findOne({ _id: brandId });

    if (existingBrand) {
      existingBrand.brandname = brandname || existingBrand.brandname;
      existingBrand.status = status || existingBrand.status;

      const updatedBrand = await existingBrand.save();

      res.status(200).json({
        status: 200,
        message: "Brand has been updated",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Brand not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing or invalid",
      data: null,
    });
  }
});
router.delete("/delete-brand/:id", async (req, res) => {
  try {
    const brandId = req.params.id;

    const deletedBrand = await brands.findByIdAndDelete(brandId);

    if (deletedBrand) {
      res.status(200).json({
        status: 200,
        message: "Brand has been deleted",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Brand not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid brand ID",
      data: null,
    });
  }
});
router.post("/add-hardisk", async (req, res) => {
  try {
    const hardiskname = req.body.hardiskname;
    const status = req.body.status;
    const itemNameexist = await hardisk.findOne({ hardiskname: hardiskname });
    if (!itemNameexist) {
      const MenuEmp = new hardisk({
        hardiskname: req.body.hardiskname,
        status: status,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "hardisk has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "hardisk name already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-hardiskbyid/:id", async (req, res) => {
  try {
    const hardiskID = req.params.id;

    const hardiskdata = await hardisk.findById(hardiskID);

    if (hardiskdata) {
      res.status(200).json({
        status: 200,
        message: "hardisk found",
        data: hardiskdata,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "hardisk not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid hardisk ID",
      data: null,
    });
  }
});
router.get("/get-hardisk", async (req, res) => {
  try {
    const brand = await hardisk.find();

    res.status(200).json({
      status: 200,
      message: "hardisk found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid hardisk ID",
      data: null,
    });
  }
});
router.put("/update-hardisk/:id", async (req, res) => {
  try {
    const hardiskID = req.params.id;
    const { hardiskname, status } = req.body;

    const existingBrand = await hardisk.findOne({ _id: hardiskID });
    if (existingBrand) {
      existingBrand.hardiskname = hardiskname || existingBrand.hardiskname;
      existingBrand.status = status || existingBrand.status;

      await existingBrand.save();

      res.status(200).json({
        status: 200,
        message: "hardisk has been updated",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "hardisk not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing or invalid",
      data: null,
    });
  }
});
router.delete("/delete-hardisk/:id", async (req, res) => {
  try {
    const hardiskID = req.params.id;

    const deletedhardisk = await hardisk.findByIdAndDelete(hardiskID);

    if (deletedhardisk) {
      res.status(200).json({
        status: 200,
        message: "hardisk has been deleted",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "hardisk not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid brand ID",
      data: null,
    });
  }
});
router.post("/add-cpu", async (req, res) => {
  try {
    const cpuname = req.body.cpuname;
    const status = req.body.status;
    const itemNameexist = await cpu.findOne({ cpuname: cpuname });
    if (!itemNameexist) {
      const MenuEmp = new cpu({
        cpuname: req.body.cpuname,
        status: status,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "cpu has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "cpu name already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-cpubyid/:id", async (req, res) => {
  try {
    const cpuID = req.params.id;

    const cpuadd = await cpu.findById(cpuID);

    if (cpuadd) {
      res.status(200).json({
        status: 200,
        message: "cpu found",
        data: cpuadd,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "cpu not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid cpu ID",
      data: null,
    });
  }
});
router.get("/get-cpu", async (req, res) => {
  try {
    const brand = await cpu.find();

    res.status(200).json({
      status: 200,
      message: "cpu found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid cpu ID",
      data: null,
    });
  }
});
router.put("/update-cpu/:id", async (req, res) => {
  try {
    const cpuID = req.params.id;
    const { cpuname, status } = req.body;

    const existingBrand = await cpu.findOne({ _id: cpuID });
    if (existingBrand) {
      existingBrand.cpuname = cpuname || existingBrand.cpuname;
      existingBrand.status = status || existingBrand.status;

      await existingBrand.save();

      res.status(200).json({
        status: 200,
        message: "cpu has been updated",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "cpu not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing or invalid",
      data: null,
    });
  }
});
router.delete("/delete-cpu/:id", async (req, res) => {
  try {
    const cpuID = req.params.id;

    const deletecpu = await cpu.findByIdAndDelete(cpuID);

    if (deletecpu) {
      res.status(200).json({
        status: 200,
        message: "cpu has been deleted",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "cpu not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid cpu ID",
      data: null,
    });
  }
});
router.post("/add-operating", async (req, res) => {
  try {
    const operatingname = req.body.operatingname;
    const status = req.body.status;
    const itemNameexist = await operatingsystem.findOne({
      operatingname: operatingname,
    });
    if (!itemNameexist) {
      const MenuEmp = new operatingsystem({
        operatingname: req.body.operatingname,
        status: status,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "operating system has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "operating system name already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-operatingbyid/:id", async (req, res) => {
  try {
    const operatingID = req.params.id;

    const operatingadd = await operatingsystem.findById(operatingID);

    if (operatingadd) {
      res.status(200).json({
        status: 200,
        message: "operating system found",
        data: operatingadd,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "operating system not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid operating system ID",
      data: null,
    });
  }
});
router.get("/get-operating", async (req, res) => {
  try {
    const brand = await operatingsystem.find();

    res.status(200).json({
      status: 200,
      message: "operating system found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid operating system ID",
      data: null,
    });
  }
});
router.put("/update-operating/:id", async (req, res) => {
  try {
    const operatingID = req.params.id;
    const { operatingname, status } = req.body;

    const existingBrand = await operatingsystem.findOne({ _id: operatingID });
    if (existingBrand) {
      existingBrand.operatingname =
        operatingname || existingBrand.operatingname;
      existingBrand.status = status || existingBrand.status;

      await existingBrand.save();

      res.status(200).json({
        status: 200,
        message: "operating system has been updated",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "operating system not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing or invalid",
      data: null,
    });
  }
});
router.delete("/delete-operating/:id", async (req, res) => {
  try {
    const operatingID = req.params.id;

    const deletecpu = await operatingsystem.findByIdAndDelete(operatingID);

    if (deletecpu) {
      res.status(200).json({
        status: 200,
        message: "operating system has been deleted",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "operating system not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid operating ID",
      data: null,
    });
  }
});
router.post("/add-ram", async (req, res) => {
  try {
    const ramname = req.body.ramname;
    const status = req.body.status;
    const itemNameexist = await ram.findOne({ ramname: ramname });
    if (!itemNameexist) {
      const MenuEmp = new ram({
        ramname: req.body.ramname,
        status: status,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "ram has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "ram already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-rambyid/:id", async (req, res) => {
  try {
    const ramID = req.params.id;

    const RamID = await ram.findById(ramID);

    if (RamID) {
      res.status(200).json({
        status: 200,
        message: "ram found",
        data: RamID,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "ram not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid ram ID",
      data: null,
    });
  }
});
router.get("/get-ram", async (req, res) => {
  try {
    const brand = await ram.find();

    res.status(200).json({
      status: 200,
      message: "ram found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid ram ID",
      data: null,
    });
  }
});
router.put("/update-ram/:id", async (req, res) => {
  try {
    const ramID = req.params.id;
    const { ramname, status } = req.body;

    const existingBrand = await ram.findOne({ _id: ramID });
    if (existingBrand) {
      existingBrand.ramname = ramname || existingBrand.ramname;
      existingBrand.status = status || existingBrand.status;

      await existingBrand.save();

      res.status(200).json({
        status: 200,
        message: "ram has been updated",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "ram not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing or invalid",
      data: null,
    });
  }
});
router.delete("/delete-ram/:id", async (req, res) => {
  try {
    const ramID = req.params.id;

    const deletecpu = await ram.findByIdAndDelete(ramID);

    if (deletecpu) {
      res.status(200).json({
        status: 200,
        message: "ram has been deleted",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "ram not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid ram ID",
      data: null,
    });
  }
});
router.post("/add-asin", async (req, res) => {
  try {
    const asinname = req.body.asinname;
    const status = req.body.status;
    const itemNameexist = await asin.findOne({ asinname: asinname });
    if (!itemNameexist) {
      const MenuEmp = new asin({
        asinname: req.body.asinname,
        status: status,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "asin has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "asin already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-asinbyid/:id", async (req, res) => {
  try {
    const asimID = req.params.id;

    const RamID = await asin.findById(asimID);

    if (RamID) {
      res.status(200).json({
        status: 200,
        message: "asin found",
        data: RamID,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "asin not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid asin ID",
      data: null,
    });
  }
});
router.get("/get-asin", async (req, res) => {
  try {
    const brand = await asin.find();

    res.status(200).json({
      status: 200,
      message: "asin found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid asin ID",
      data: null,
    });
  }
});
router.put("/update-asin/:id", async (req, res) => {
  try {
    const ramID = req.params.id;
    const { asinname, status } = req.body;

    const existingBrand = await asin.findOne({ _id: ramID });
    if (existingBrand) {
      existingBrand.asinname = asinname || existingBrand.asinname;
      existingBrand.status = status || existingBrand.status;

      await existingBrand.save();

      res.status(200).json({
        status: 200,
        message: "asin has been updated",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "asin not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing or invalid",
      data: null,
    });
  }
});
router.delete("/delete-asin/:id", async (req, res) => {
  try {
    const ramID = req.params.id;

    const deletecpu = await asin.findByIdAndDelete(ramID);

    if (deletecpu) {
      res.status(200).json({
        status: 200,
        message: "asin has been deleted",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "asin not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid asin ID",
      data: null,
    });
  }
});
router.post("/add-category", upload.single("image"), async (req, res) => {
  try {
    const categoryname = req.body.categoryname;
    const status = req.body.status;
    const itemNameexist = await category.findOne({
      categoryname: categoryname,
    });
    if (!itemNameexist) {
      const file = req.file;
      let ManuImage = null;

      if (file) {
        ManuImage = `data:image/png;base64,${file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(ManuImage);
        ManuImage = result.url;
      }

      const MenuEmp = new category({
        categoryname: req.body.categoryname,
        status: status,
        image: ManuImage,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "category has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "category already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-categorybyid/:id", async (req, res) => {
  try {
    const asimID = req.params.id;

    const RamID = await category.findById(asimID);

    if (RamID) {
      res.status(200).json({
        status: 200,
        message: "category found",
        data: RamID,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "category not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid category ID",
      data: null,
    });
  }
});
router.get("/get-category", async (req, res) => {
  try {
    const brand = await category.find();

    res.status(200).json({
      status: 200,
      message: "category found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid category ID",
      data: null,
    });
  }
});
router.put("/update-category/:id", upload.single("image"), async (req, res) => {
  try {
    const ramID = req.params.id;
    const { categoryname, status, image } = req.body;

    const existingBrand = await category.findOne({ _id: ramID });
    if (existingBrand) {
      const file = req.file;

      // Check if a file is uploaded
      let ManuImage = null;
      if (file) {
        ManuImage = `data:image/png;base64,${file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(ManuImage);
        ManuImage = result.url;
      }
      existingBrand.categoryname = categoryname || existingBrand.categoryname;
      existingBrand.status = status || existingBrand.status;
      existingBrand.image = ManuImage || existingBrand.image;

      await existingBrand.save();

      res.status(200).json({
        status: 200,
        message: "category has been updated",
        data: null,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "category not found",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing or invalid",
      data: null,
    });
  }
});
router.delete("/delete-category/:id", async (req, res) => {
  try {
    const ramID = req.params.id;

    const deletecpu = await category.findByIdAndDelete(ramID);

    if (!deletecpu) {
      return res.status(404).json({
        status: 404,
        message: "category not found",
        data: null,
      });
    }

    const image = deletecpu.image;

    if (image) {
      const parts = image.split("/");

      // Get the last part of the split array
      const lastPart = parts[parts.length - 1];

      // Split the last part by '.'
      const publicId = lastPart.split(".")[0];

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
      console.log(result);
    }

    res.status(200).json({
      status: 200,
      message: "category deleted successfully",
      data: null,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid category ID",
      data: null,
    });
  }
});
router.post("/add-subcategory", upload.single("image"), async (req, res) => {
  try {
    const subcategoryname = req.body.subcategoryname;
    const status = req.body.status;
    const categoryId = req.body.categoryId;
    const itemNameexist = await subcategory.findOne({
      subcategoryname: subcategoryname,
    });
    if (!itemNameexist) {
      const file = req.file;
      let ManuImage = null;

      if (file) {
        ManuImage = `data:image/png;base64,${file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(ManuImage);
        ManuImage = result.url;
      }

      const MenuEmp = new subcategory({
        subcategoryname: req.body.subcategoryname,
        status: status,
        categoryId: categoryId,
        image: ManuImage,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "subcategory has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "subcategory already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/subcategory/:id", async (req, res) => {
  try {
    const subcategoryId = req.params.id;
    const subcategory1 = await subcategory.findById(subcategoryId);
    if (subcategory1) {
      res.status(200).json({
        status: 200,
        message: "Subcategory found",
        data: subcategory1,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Subcategory not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.get("/get-subcategory", async (req, res) => {
  try {
    const brand = await subcategory.find();

    res.status(200).json({
      status: 200,
      message: "subcategory found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid subcategory ID",
      data: null,
    });
  }
});
router.put("/subcategory/:id", upload.single("image"), async (req, res) => {
  try {
    const subcategoryId = req.params.id;
    const { subcategoryname, status, categoryId } = req.body;
    const file = req.file;

    // Check if a file is uploaded
    let ManuImage = null;
    if (file) {
      ManuImage = `data:image/png;base64,${file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(ManuImage);
      ManuImage = result.url;
    } else {
      // If no file is uploaded, retain the existing image
      const subcategoryData = await subcategory.findById(subcategoryId);
      if (subcategoryData) {
        ManuImage = subcategoryData.image;
      }
    }

    const updatedData = {
      subcategoryname,
      status,
      categoryId,
      image: ManuImage,
    };

    const updatedSubcategory = await subcategory.findByIdAndUpdate(
      subcategoryId,
      updatedData,
      { new: true }
    );

    if (updatedSubcategory) {
      res.status(200).json({
        status: 200,
        message: "Subcategory updated successfully",
        data: updatedSubcategory,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Subcategory not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.delete("/subcategory/:id", async (req, res) => {
  try {
    const subcategoryId = req.params.id;
    const deletedSubcategory = await subcategory.findByIdAndDelete(
      subcategoryId
    );
    if (deletedSubcategory) {
      res.status(200).json({
        status: 200,
        message: "Subcategory deleted successfully",
        data: deletedSubcategory,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Subcategory not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.post("/add-products", upload.single("image"), async (req, res) => {
  try {
    const productname = req.body.productname;
    const status = req.body.status;
    const subcategoryId = req.body.categoryId;
    const slug1 = req.body.slug;
    const slug = slugify(slug1, {
      replacement: "-", // replace spaces with -
      lower: true, // convert to lower case
    });
    const brands = req.body.brands;
    const hardisk = req.body.hardisk;
    const cpu = req.body.cpu;
    const operatingsysytem = req.body.operatingsysytem;
    const ram = req.body.ram;
    const asin = req.body.asin;
    const description = req.body.description;
    const price = req.body.price;
    const stock = req.body.stock;
    const itemNameexist = await product.findOne({ productname: productname });
    if (!itemNameexist) {
      const file = req.file;
      let ManuImage = null;

      if (file) {
        ManuImage = `data:image/png;base64,${file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(ManuImage);
        ManuImage = result.url;
      }

      const MenuEmp = new product({
        productname: req.body.productname,
        status: status,
        categoryId: subcategoryId,
        image: ManuImage,
        slug: slug,
        brands: brands,
        hardisk: hardisk,
        cpu: cpu,
        operatingsysytem: operatingsysytem,
        ram: ram,
        asin: asin,
        description: description,
        price: price,
        stock: stock,
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "product has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "product already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/products/:id", async (req, res) => {
  try {
    const productsID = req.params.id;
    const subcategory = await product.findById(productsID);
    if (subcategory) {
      res.status(200).json({
        status: 200,
        message: "product found",
        data: subcategory,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "products not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.get("/get-products", async (req, res) => {
  try {
    const brand = await product.find();

    res.status(200).json({
      status: 200,
      message: "products found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid products ID",
      data: null,
    });
  }
});
router.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      productname,
      status,
      subcategoryId,
      slug: slug1,
      brands,
      hardisk,
      cpu,
      operatingsysytem,
      ram,
      asin,
      description,
      price,
      stock,
    } = req.body;

    const slug = slugify(slug1, {
      replacement: "-",
      lower: true,
    });

    const existingProduct = await product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
        data: null,
      });
    }

    let ManuImage = null;
    if (req.file) {
      ManuImage = `data:image/png;base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(ManuImage);
      ManuImage = result.url;
    } else {
      ManuImage = existingProduct.image;
    }

    existingProduct.productname = productname;
    existingProduct.status = status;
    existingProduct.subcategoryId = subcategoryId;
    existingProduct.slug = slug;
    existingProduct.brands = brands;
    existingProduct.hardisk = hardisk;
    existingProduct.cpu = cpu;
    existingProduct.operatingsysytem = operatingsysytem;
    existingProduct.ram = ram;
    existingProduct.asin = asin;
    existingProduct.description = description;
    existingProduct.price = price;
    existingProduct.stock = stock;
    existingProduct.image = ManuImage;

    const updatedProduct = await existingProduct.save();
    res.status(200).json({
      status: 200,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.put(
  "/productsthumbnail/:id",
  upload.array("thumbnails", 8),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const existingProduct = await product.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({
          status: 404,
          message: "Product not found",
          data: null,
        });
      }

      let newThumbnails = [];

      if (req.files && req.files.length > 0) {
        for (let file of req.files) {
          const thumbnailImage = `data:image/png;base64,${file.buffer.toString(
            "base64"
          )}`;
          const result = await cloudinary.uploader.upload(thumbnailImage);
          newThumbnails.push(result.url);
        }
      }

      // Concatenate existing thumbnails with new thumbnails
      const updatedThumbnails =
        existingProduct.thumbnails.concat(newThumbnails);

      // Update product's thumbnails
      existingProduct.thumbnails = updatedThumbnails;

      const updatedProduct = await existingProduct.save();
      res.status(200).json({
        status: 200,
        message: "Product thumbnails updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        data: null,
      });
    }
  }
);
router.delete("/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
        data: null,
      });
    }

    const image = deletedProduct.image;

    if (image) {
      const parts = image.split("/");

      // Get the last part of the split array
      const lastPart = parts[parts.length - 1];

      // Split the last part by '.'
      const publicId = lastPart.split(".")[0];

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
      console.log(result);
    }

    res.status(200).json({
      status: 200,
      message: "Product deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.post("/add-slider", upload.single("image"), async (req, res) => {
  try {
    const status = req.body.status;

    const file = req.file;
    let ManuImage = null;

    if (file) {
      ManuImage = `data:image/png;base64,${file.buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(ManuImage);
      ManuImage = result.url;
    }

    const MenuEmp = new slider({
      status: status,

      image: ManuImage,
    });
    const menu = await MenuEmp.save();
    res.status(201).json({
      status: 201,
      message: "slider has been Added",
      data: MenuEmp,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/slider/:id", async (req, res) => {
  try {
    const productsID = req.params.id;
    const subcategory = await slider.findById(productsID);
    if (subcategory) {
      res.status(200).json({
        status: 200,
        message: "slider found",
        data: subcategory,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "slider not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.get("/get-allslider", async (req, res) => {
  try {
    const brand = await slider.find();

    res.status(200).json({
      status: 200,
      message: "slider found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid products ID",
      data: null,
    });
  }
});
router.put("/slider/:id", upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    const { status } = req.body;

    const existingProduct = await slider.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        status: 404,
        message: "slider not found",
        data: null,
      });
    }

    let ManuImage = null;
    if (req.file) {
      ManuImage = `data:image/png;base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(ManuImage);
      ManuImage = result.url;
    } else {
      ManuImage = existingProduct.image;
    }

    existingProduct.status = status;
    existingProduct.image = ManuImage;

    const updatedProduct = await existingProduct.save();
    res.status(200).json({
      status: 200,
      message: "slider updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.delete("/slider/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await slider.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
        data: null,
      });
    }

    const image = deletedProduct.image;

    if (image) {
      const parts = image.split("/");

      // Get the last part of the split array
      const lastPart = parts[parts.length - 1];

      // Split the last part by '.'
      const publicId = lastPart.split(".")[0];

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
      console.log(result);
    }

    res.status(200).json({
      status: 200,
      message: "slider deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.post("/add-banner", upload.single("image"), async (req, res) => {
  try {
    const status = req.body.status;

    const file = req.file;
    let ManuImage = null;

    if (file) {
      ManuImage = `data:image/png;base64,${file.buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(ManuImage);
      ManuImage = result.url;
    }

    const MenuEmp = new banner({
      status: status,

      image: ManuImage,
    });
    const menu = await MenuEmp.save();
    res.status(201).json({
      status: 201,
      message: "banner has been Added",
      data: MenuEmp,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/banner/:id", async (req, res) => {
  try {
    const productsID = req.params.id;
    const subcategory = await banner.findById(productsID);
    if (subcategory) {
      res.status(200).json({
        status: 200,
        message: "banner found",
        data: subcategory,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "banner not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.get("/get-allbanner", async (req, res) => {
  try {
    const brand = await banner.find();

    res.status(200).json({
      status: 200,
      message: "banner found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid products ID",
      data: null,
    });
  }
});
router.put("/banner/:id", upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    const { status } = req.body;

    const existingProduct = await banner.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        status: 404,
        message: "banner not found",
        data: null,
      });
    }

    let ManuImage = null;
    if (req.file) {
      ManuImage = `data:image/png;base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(ManuImage);
      ManuImage = result.url;
    } else {
      ManuImage = existingProduct.image;
    }

    existingProduct.status = status;
    existingProduct.image = ManuImage;

    const updatedProduct = await existingProduct.save();
    res.status(200).json({
      status: 200,
      message: "slider updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.delete("/banner/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await banner.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        status: 404,
        message: "banner not found",
        data: null,
      });
    }

    const image = deletedProduct.image;

    if (image) {
      const parts = image.split("/");

      // Get the last part of the split array
      const lastPart = parts[parts.length - 1];

      // Split the last part by '.'
      const publicId = lastPart.split(".")[0];

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
      console.log(result);
    }

    res.status(200).json({
      status: 200,
      message: "slider deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
//--------------------------------USERS-SIDE---------------------------------------
router.get("/get-category-user", async (req, res) => {
  try {
    const brand = await category.find();

    res.status(200).json({
      status: 200,
      message: "category found",
      data: brand,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Invalid subcategory ID",
      data: null,
    });
  }
});
router.get("/get-products-user", async (req, res) => {
  try {
    const products = await product.find().populate({
      path: "categoryId",
      populate: {
        path: "categoryId",
      },
    });

    res.status(200).json({
      status: 200,
      message: "Products found",
      data: products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: "Error: Invalid product ID",
      data: null,
    });
  }
});
router.get("/get-allproducts-user", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;

    const products = await product.find().skip(skip).limit(pageSize);

    res.status(200).json({
      status: 200,
      message: "Products found",
      data: products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: "Error: Invalid product ID",
      data: null,
    });
  }
});
router.get("/get-all-related-products-user", async (req, res) => {
  try {
    const { _id, categoryId } = req.query;

    const productData = await product.findById(_id);

    if (!productData) {
      return res.status(404).json({
        status: 404,
        message: "Product not found",
        data: null,
      });
    }

    const relatedProducts = await product.find({
      categoryId: productData.categoryId,
      _id: { $ne: productData._id }, // Exclude the current product
    });

    res.status(200).json({
      status: 200,
      message: "Related Products found",
      data: relatedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: null,
    });
  }
});
router.get("/get-allproducts-search-user", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const productname = req.query.productname;

    const skip = (page - 1) * pageSize;

    let query = {};

    if (productname) {
      // If productName is provided in the query, create a query to match
      query = { productname: { $regex: new RegExp(productname, "i") } };
    }

    const products = await product.find(query).skip(skip).limit(pageSize);

    res.status(200).json({
      status: 200,
      message: "Products found",
      data: products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: "Error: Invalid product ID",
      data: null,
    });
  }
});
let page = 1; // Initialize page at 1

router.get("/getproduct-bycategoryId/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const isDesktop = req.query.isDesktop;
    const page = parseInt(req.query.page) || 1;
    const limit = page * 12;

    let products;

    if (isDesktop) {
      const laptop = await category.findOne({ categoryname: "Laptop" });
      let laptopId = laptop._id;
      products = await product
        .find({ categoryId: { $ne: laptopId } })
        .limit(limit); // Remove the skip function

      if (products.length === 0) {
        products = await product.find({}).limit(limit); // Remove the skip function
      }
    } else {
      products = await product.find({ categoryId: categoryId }).limit(limit); // Remove the skip function
    }

    if (products) {
      res.status(200).json({
        status: 200,
        message: "Products found",
        data: products,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "No product found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: "Error: Invalid product ID",
      data: null,
    });
  }
});
router.get("/getproduct-filter-bycategoryId/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Find all products in the specified category
    const products = await product.find({ categoryId: categoryId });

    // Get distinct values for brands, hardisk, cpu, and ram
    const distinctBrands = await product.distinct("brands", {
      categoryId: categoryId,
    });
    const distinctHardisk = await product.distinct("hardisk", {
      categoryId: categoryId,
    });
    const distinctCpu = await product.distinct("cpu", {
      categoryId: categoryId,
    });
    const distinctRam = await product.distinct("ram", {
      categoryId: categoryId,
    });

    // Return the results
    res.status(200).json({
      status: 200,
      message: "Products found",
      brands: distinctBrands,
      hardisk: distinctHardisk,
      cpu: distinctCpu,
      ram: distinctRam,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.post("/user-signup", async (req, res) => {
  let qdate = new Date();
  let date = qdate.toDateString();
  let Id = Math.floor(Math.random() * 10000000) + 1;
  let email = req.body.email;
  const mail = await userauth.findOne({ email: email });
  if (mail) {
    res
      .status(404)
      .json({ status: 404, message: "email already present", data: null });
  }
  try {
    const registerEmp = new userauth({
      Id: Id,
      name: req.body.name,
      password: req.body.password,
      email: req.body.email,
      isVarified: false,
      isNewUser: true,
    });
    const registered = await registerEmp.save();
    const data = await userauth
      .findOne({ email: email })
      .select({ _id: 1, email: 1 });
    res.status(201).json({
      status: 201,
      message: "user has been Created",
      data: data,
    });
    var transpoter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "wasimxaman13@gmail.com",
        pass: Email_otp_pass,
      },
    });
    var mailoption = {
      from: "wasimxaman13@gmail.com",
      to: email,
      subject: "Varify Email",
      html: `<p>Please click the following link to verify your email: <a href="https://tech-geeks.vercel.app/login">Verify Email</a></p>`,
    };
    transpoter.sendMail(mailoption, function (error, info) {
      if (error) {
        console.log(error);
        res.status(500).json({
          status: 500,
          message: "Failed to send OTP email",
          data: null,
        });
      } else {
        console.log("Email sent: " + info.response);
        res.status(201).json({
          status: 201,
          message: "Send link successfully",
          data: null,
        });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ status: 400, message: "not found", data: null });
  }
});
router.post("/user-Login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000;
    const expirationTime = new Date().getTime() + oneMonthInMillis;
    const useremail = await userauth.findOne({ email: email });
    const ismatch = await bcrypt.compare(password, useremail.password);

    if (!useremail || !password) {
      res.status(400).json({
        status: 400,
        message: "Enter Correct email or password",
        data: null,
      });
    } else if (ismatch) {
      const getmens = await userauth.findOneAndUpdate(
        { email: email },
        { $set: { expireIn: expirationTime } },
        { new: true }
      );
      const token = await useremail.generateAuthToken();
      res.cookie("jwt", token, { httpOnly: true });
      res.status(200).json({
        status: 200,
        message: "Login Successfully",
        data: getmens,
      });
    } else {
      res
        .status(404)
        .json({ status: 400, message: "Invalid Password", data: null });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 400, message: "invalid email", data: null });
  }
});
router.post("/send-otp", async (req, res) => {
  try {
    let email = req.body.email;
    const mail = await userauth.findOne({ email: email });
    if (!mail) {
      res
        .status(404)
        .json({ status: 400, message: "This email not exist", data: null });
    } else {
      const random = Math.floor(Math.random() * 10000) + 1;
      console.log(random);
      const otpData = new emailvarify({
        email: req.body.email,
        code: random,
        expireIn: new Date().getTime() + 60 * 10000,
      });
      var transpoter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "wasimxaman13@gmail.com",
          pass: Email_otp_pass,
        },
      });
      var mailoption = {
        from: "wasimxaman13@gmail.com",
        to: email,
        subject: "sending email using nodejs",
        text: `Varify Email OTP ${random}`,
      };
      transpoter.sendMail(mailoption, function (error, info) {
        if (error) {
          console.log(error);
          res.status(500).json({
            status: 500,
            message: "Failed to send OTP email",
            data: null,
          });
        } else {
          console.log("Email sent: " + info.response);
          res.status(201).json({
            status: 201,
            message: "Send OTP successfully",
            data: { Otp: random },
          });
        }
      });
      const varifyemail = await otpData.save();
      res.status(201).json({
        status: 201,
        message: "Send otp successfully",
        data: { Otp: random },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "internel Server error",
      data: null,
    });
  }
});
router.post("/emailVrifyOtp", async (req, res) => {
  try {
    const email = req.body.email;
    const code = req.body.code;
    const mail = await emailvarify.findOne({ code: code, email: email });
    if (mail) {
      const currentTime = new Date().getTime();
      const Diff = mail.expireIn - currentTime;
      if (Diff < 0) {
        res.status(401).json({
          status: 401,
          message: "otp expire with in 5 mints",
          data: null,
        });
      } else {
        const getmens = await userauth.findOneAndUpdate(
          { email: email },
          { $set: { isVarified: true } },
          { new: true }
        );

        res.status(200).json({
          status: 200,
          message: "email varification successful",
          data: null,
        });
      }
    } else {
      res.status(400).json({ status: 400, message: "Invalid Otp", data: null });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 400, message: "Invalid Otp", data: null });
  }
});
router.put(
  "/update-user-profile/:_id",
  upload.single("image"),
  async (req, res) => {
    try {
      const id = req.params._id;

      const user = await userauth.findOne({ _id: id });

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "user not found",
          data: null,
        });
      }
      const file = req.file;
      let profileImageURL = user.image;

      if (file) {
        profileImageURL = `data:image/png;base64,${file.buffer.toString(
          "base64"
        )}`;

        const result = await cloudinary.uploader.upload(profileImageURL);
        profileImageURL = result.url;
      }
      const updatedUser = await userauth.findOneAndUpdate(
        { _id: id },
        { ...req.body, image: profileImageURL },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          status: 404,
          message: "user not found",
          data: null,
        });
      }

      res.status(200).json({
        status: 200,
        message: "user updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 500,
        message: "Internal server error",
        data: null,
      });
    }
  }
);
router.delete("/user_image/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const user = await userauth.findById(productId);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "userauth not found",
        data: null,
      });
    }

    const image = user.image;

    if (!image) {
      return res.status(404).json({
        status: 404,
        message: "Image not found for userauth",
        data: null,
      });
    }

    const parts = image.split("/");
    const lastPart = parts[parts.length - 1];
    const publicId = lastPart.split(".")[0];

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    console.log(result);

    // Remove the image field from the user document
    user.image = undefined;
    const deleteimage = await user.save();

    res.status(200).json({
      status: 200,
      message: "Image deleted successfully for userauth",
      data: deleteimage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
});
router.post("/changePassword", async (req, res) => {
  try {
    const email = req.body.email;
    const mailVarify = await userauth.findOne({ email: email });
    if (mailVarify) {
      const password = req.body.password;
      const ismatch = await bcrypt.compare(password, mailVarify.password);
      console.log(ismatch);
      mailVarify.password = password;
      const registered = await mailVarify.save();
      res.status(201).json({
        status: 201,
        message: "password change successful",
        data: mailVarify,
      });
    } else {
      res
        .status(400)
        .json({ status: 400, message: "email not exist", data: null });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 400, message: "Invalid Otp", data: null });
  }
});
router.post("/add-or-remove-product-item-addtocart", async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.body.userId;
    const AddToCartexist = await cartitem.findOne({
      productId,
      userId,
      status: "Active",
    });

    if (!AddToCartexist) {
      const AddToCartexistAdd = new cartitem({
        userId: req.body.userId,
        productId: req.body.productId,
        status: "Active",

        quantity: 1,
      });
      const menu = await AddToCartexistAdd.save();
      res.status(201).json({
        status: 201,
        message: "Successfully added item into cart",
        data: null,
      });
    } else {
      const result = await cartitem.deleteOne({ productId: productId });
      if (result.deletedCount === 1) {
        res.status(200).json({
          status: 200,
          message: "Successfully deleted item from the cart",
          data: null,
        });
      } else {
        res
          .status(404)
          .json({ status: 404, message: "Food is not found", data: null });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});
router.get("/get-product-item-to-addtocart/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const data = await cartitem.findOne({ userId: userId });

    if (data) {
      const data1 = await cartitem
        .find(
          { userId: userId },
          { _id: 0, userId: 0, createdAt: 0, updatedAt: 0, __v: 0 }
        )
        .populate("productId")
        .skip(skip);

      const foodIdArray = data1
        .filter((item) => item.productId && item.status === "Active")
        .map((item) => ({
          productId: item.productId,
          status: item.status,
          quantity: item.quantity,
        }));

      res.status(200).json({
        status: 200,
        message: "addtocart User details",
        data: foodIdArray,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "It seems like your cart is empty",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null,
    });
  }
});
router.get("/get-foodid-to-addtocart", async (req, res) => {
  try {
    const userId = String(req.query.userId);
    const productId = String(req.query.productId);
    const cartItem = await cartitem.findOne({ userId, productId });
    if (!cartItem || cartItem.status !== "Active") {
      res.status(200).json({
        status: 200,
        message: "cartitem product IDs",
        data: { isInCart: false },
      });
    } else {
      res.status(200).json({
        status: 200,
        message: "cartitem product IDs",
        data: { isInCart: true },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: { isInCart: false },
    });
  }
});
router.put("/product-item-addtocart-quantity-inc", async (req, res) => {
  try {
    const userId = String(req.query.userId);
    const productId = String(req.query.productId);
    const data = await cartitem.findOne({
      userId,
      productId,
      status: "Active",
    });

    if (!data) {
      res.status(200).json({
        status: 200,
        message: "Not found",
        data: null,
      });
    } else {
      const updatedCount = await cartitem.findOneAndUpdate(
        { userId: userId, productId: productId, status: "Active" },
        { $inc: { quantity: 1 } },
        { new: true }
      );
      res.status(200).json({
        status: 200,
        message: "quantity added",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(200).json({
      status: 200,
      message: "Not into cart",
      data: null,
    });
  }
});
router.put("/product-item-addtocart-quantity-dec", async (req, res) => {
  try {
    const userId = String(req.query.userId);
    const productId = String(req.query.productId);

    const data = await cartitem.findOne({
      userId,
      productId,
      status: "Active",
    });

    if (!data) {
      res.status(404).json({
        status: 404,
        message: "Item not found in the cart",
        data: null,
      });
    } else {
      if (data.quantity > 1) {
        const updatedCount = await cartitem.findOneAndUpdate(
          { userId: userId, productId: productId, status: "Active" },
          { $inc: { quantity: -1 } },
          { new: true }
        );

        res.status(200).json({
          status: 200,
          message: "Quantity decremented",
          data: null,
        });
      } else {
        res.status(200).json({
          status: 200,
          message: "Quantity cannot be less than 1",
          data: null,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(200).json({
      status: 200,
      message: "Not into cart",
      data: null,
    });
  }
});
router.get("/get-allstate-user", async (req, res) => {
  try {
    const products = await state.find();
    res.status(200).json({
      status: 200,
      message: "state found",
      data: products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: "Error: Invalid state ID",
      data: null,
    });
  }
});
router.put("/user-changePassword", async (req, res) => {
  try {
    const email = req.body.email;
    const mailVarify = await userauth.findOne({ email: email });

    if (mailVarify) {
      const oldPassword = req.body.oldPassword;
      const newPassword = req.body.newPassword;

      // Check if the provided old password matches the one in the database
      const isMatch = await bcrypt.compare(oldPassword, mailVarify.password);

      if (isMatch) {
        // If old password is correct, update the password with the new one
        mailVarify.password = newPassword;
        const updatedUser = await mailVarify.save();

        res.status(201).json({
          status: 201,
          message: "Password change successful",
          data: updatedUser,
        });
      } else {
        // If old password is incorrect, send an error message
        res.status(400).json({
          status: 400,
          message: "Old password is incorrect",
          data: null,
        });
      }
    } else {
      res.status(400).json({
        status: 400,
        message: "Email does not exist",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: "Invalid OTP",
      data: null,
    });
  }
});
module.exports = router;
