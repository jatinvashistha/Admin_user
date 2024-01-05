import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, phoneNumber, password } = req.body;

  const file = req.file;

  if (!name || !email || !phoneNumber || !password || !file)
    return next(new ErrorHandler("please enter all field", 400));

  let user = await User.findOne({ $or: [{ email }, { phoneNumber }] });

  // let user = await User.findOne({ email });

  if (user) return next(new ErrorHandler("User Already exist", 409));
  //upload file on cloudinary

  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
  user = await User.create({
    name,
    email,
    phoneNumber,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  sendToken(res, user, "Registered Successfully");
});

//login

export const login = catchAsyncError(async (req, res, next) => {
  const { email, phoneNumber, password } = req.body;

  if ((!email && !phoneNumber) || !password)
    return next(
      new ErrorHandler(
        "Please provide either email or phoneNumber and password",
        400,
      ),
    );

  let user;

  if (email) {
    user = await User.findOne({ email }).select("+password");
  } else if (phoneNumber) {
    user = await User.findOne({ phoneNumber }).select("+password");
  }

  if (!user)
    return next(
      new ErrorHandler("Incorrect Email or Phone Number or Password", 401),
    );

  const isMatch = await user.comparePassword(password);

  if (!isMatch)
    return next(
      new ErrorHandler("Incorrect Email or Phone Number or Password", 401),
    );

  sendToken(res, user, `Welcome back, ${user.name}`, 200);
});

//logout
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

// get my profile
export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

// change password

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("Please enter all field", 400));

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) return next(new ErrorHandler("Incorrect Old Password", 400));

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});

// update profile

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res
    .status(200)

    .json({
      success: true,
      message: "Profile Updated successfuly",
    });
});

// update profile picture
export const updateprofilepicture = catchAsyncError(async (req, res, next) => {
  const file = req.file;

  const user = await User.findById(req.user._id);

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  user.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Picture Updated Successfully",
  });
});

//

//admin controllers

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    success: true,
    users,
  });
});

export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("User is not found", 404));

  if (user.role === "user") user.role = "admin";
  else user.role = "user";

  await user.save();
  res.status(200).json({
    success: true,
    message: "Role Updated successfully",
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("User is not found", 404));

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // cancel subscription

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted successfully",
  });
});

export const updateUser = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const { name } = req.body; // Add support for updating the name

  const { user } = req;

  // Check if the logged-in user is an admin
  if (user.role !== "admin") {
    return next(
      new ErrorHandler(
        "Permission denied. Only admins can update user details.",
        403,
      ),
    );
  }

  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    return next(new ErrorHandler("User is not found", 404));
  }

  if (name) {
    targetUser.name = name;
  }

  await cloudinary.v2.uploader.destroy(targetUser.avatar.public_id);

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  // Update user's avatar details
  targetUser.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  // Save the updated user details
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "User details updated successfully",
    data: targetUser,
  });
});

export const updateUserImage = catchAsyncError(async (req, res, next) => {
  const file = req.file;

  const { user } = req;

  // Check if the logged-in user is an admin
  if (user.role !== "admin") {
    return next(
      new ErrorHandler(
        "Permission denied. Only admins can update user details.",
        403,
      ),
    );
  }

  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    return next(new ErrorHandler("User is not found", 404));
  }

  await cloudinary.v2.uploader.destroy(targetUser.avatar.public_id);

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  // Update user's avatar details
  targetUser.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  // Save the updated user details
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "User details updated successfully",
    data: targetUser,
  });
});

export const updateUserName = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;

  const { user } = req;

  // Check if the logged-in user is an admin
  if (user.role !== "admin") {
    return next(
      new ErrorHandler(
        "Permission denied. Only admins can update user details.",
        403,
      ),
    );
  }

  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    return next(new ErrorHandler("User is not found", 404));
  }

  // Update user's name
  if (name) {
    targetUser.name = name;
  }

  // Save the updated user details
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "User name updated successfully",
    data: targetUser,
  });
});

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // cancel subscription

  await user.remove();

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User Deleted successfully",
    });
});
