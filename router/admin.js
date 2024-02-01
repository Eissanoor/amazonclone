const express = require("express");
const router = new express.Router();
const { ObjectId } = require("mongodb");
const bodyparser = require("body-parser");
const nodemailer = require("nodemailer");
const validator = require("validator");
const cron = require("node-cron");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const multer = require("multer");
const auth = require("../middleware/auth");
const adminauth = require("../model/adminauth");
const brands = require("../model/brands")
const hardisk = require("../model/hardisk")
const operatingsystem = require("../model/operationSystem")
const ram = require("../model/ram")
const cpu = require("../model/cpu")
const asin = require("../model/asin")
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
router.get("/", (req, res) =>
{
  res.status(201).json({
    status: 201,
    message: "server is running",
    data: null,
  });
})
router.post("/adminsignup", async (req, res) =>
{
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
router.post("/adminLogin", async (req, res) =>
{
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
router.post("/add-brands", async (req, res) =>
{
  try {
    const brandname = req.body.brandname;
    const status = req.body.status
    const itemNameexist = await brands.findOne({ brandname: brandname });
    if (!itemNameexist) {


      const MenuEmp = new brands({
        brandname: req.body.brandname,
        status: status
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
router.get("/get-brand", async (req, res) =>
{
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
router.get("/get-brandbyid/:id", async (req, res) =>
{
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
router.put("/update-brand/:id", async (req, res) =>
{
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
router.delete("/delete-brand/:id", async (req, res) =>
{
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
router.post("/add-hardisk", async (req, res) =>
{
  try {
    const hardiskname = req.body.hardiskname;
    const status = req.body.status
    const itemNameexist = await hardisk.findOne({ hardiskname: hardiskname });
    if (!itemNameexist) {


      const MenuEmp = new hardisk({
        hardiskname: req.body.hardiskname,
        status: status
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
router.get("/get-hardiskbyid/:id", async (req, res) =>
{
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
router.get("/get-hardisk", async (req, res) =>
{
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
router.put("/update-hardisk/:id", async (req, res) =>
{
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
router.delete("/delete-hardisk/:id", async (req, res) =>
{
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
router.post("/add-cpu", async (req, res) =>
{
  try {
    const cpuname = req.body.cpuname;
    const status = req.body.status
    const itemNameexist = await cpu.findOne({ cpuname: cpuname });
    if (!itemNameexist) {


      const MenuEmp = new cpu({
        cpuname: req.body.cpuname,
        status: status
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
router.get("/get-cpubyid/:id", async (req, res) =>
{
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
router.get("/get-cpu", async (req, res) =>
{
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
router.put("/update-cpu/:id", async (req, res) =>
{
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
router.delete("/delete-cpu/:id", async (req, res) =>
{
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
router.post("/add-operating", async (req, res) =>
{
  try {
    const operatingname = req.body.operatingname;
    const status = req.body.status
    const itemNameexist = await operatingsystem.findOne({ operatingname: operatingname });
    if (!itemNameexist) {


      const MenuEmp = new operatingsystem({
        operatingname: req.body.operatingname,
        status: status
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
router.get("/get-operatingbyid/:id", async (req, res) =>
{
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
router.get("/get-operating", async (req, res) =>
{
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
router.put("/update-operating/:id", async (req, res) =>
{
  try {
    const operatingID = req.params.id;
    const { operatingname, status } = req.body;

    const existingBrand = await operatingsystem.findOne({ _id: operatingID });
    if (existingBrand) {
      existingBrand.operatingname = operatingname || existingBrand.operatingname;
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
router.delete("/delete-operating/:id", async (req, res) =>
{
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
router.post("/add-ram", async (req, res) =>
{
  try {
    const ramname = req.body.ramname;
    const status = req.body.status
    const itemNameexist = await ram.findOne({ ramname: ramname });
    if (!itemNameexist) {


      const MenuEmp = new ram({
        ramname: req.body.ramname,
        status: status
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
router.get("/get-rambyid/:id", async (req, res) =>
{
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
router.get("/get-ram", async (req, res) =>
{
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
router.put("/update-ram/:id", async (req, res) =>
{
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
router.delete("/delete-ram/:id", async (req, res) =>
{
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
router.post("/add-asin", async (req, res) =>
{
  try {
    const asinname = req.body.asinname;
    const status = req.body.status
    const itemNameexist = await asin.findOne({ asinname: asinname });
    if (!itemNameexist) {


      const MenuEmp = new asin({
        asinname: req.body.asinname,
        status: status
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
router.get("/get-asinbyid/:id", async (req, res) =>
{
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
router.get("/get-asin", async (req, res) =>
{
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
router.put("/update-asin/:id", async (req, res) =>
{
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
router.delete("/delete-asin/:id", async (req, res) =>
{
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
module.exports = router;
