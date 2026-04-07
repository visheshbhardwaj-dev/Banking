const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const userRegisterController = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({ email });

    if (isExists) {
      return res.status(422).json({
        message: "Email already in use",
        status: "failed",
      });
    }

    const user = await userModel.create({ email, password, name });

    const userObj = user.toObject();
delete userObj.password;
delete userObj.systemUser;
    // user.password= undefined;
    // user.systemUser= undefined;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    // don't block response
    sendEmail(
      email,
      "Welcome 👋",
      "Thanks for registering",
      `<h1>Welcome ${name}</h1>`,
    );

    res.status(201).json({
      message: "User registered & email sent",
      userObj,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const userLoginController = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "INVALID email or password",
    });
  }

  const IsValidPassword = await user.comparePassword(password);

  if (!IsValidPassword) {
    return res.status(401).json({
      message: "INVALID email or password",
    });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });


  res.status(200).json({
    message: "Logged in successfully",
    user: {
      name: user.name,
      email: user.email,
    },
  });
};

module.exports = {
  userRegisterController,
  userLoginController,
};
