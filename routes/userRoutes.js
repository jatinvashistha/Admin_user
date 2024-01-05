import express from "express";
import {  changePassword, deleteMyProfile, deleteUser,  getAllUsers, getMyProfile, login, logout, register,  updateProfile, updateUser, updateUserImage, updateUserName, updateUserRole, updateprofilepicture } from "../controllers/userController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";
 

const router = express.Router();
// to register new user
router.route("/register").post(singleUpload,register);

//login
router.route("/login").post(login);
//logout
router.route("/logout").get(logout);

//get my profile
router.route("/me").get(isAuthenticated, getMyProfile);

//delete my profile
router.route("/me").delete(isAuthenticated,deleteMyProfile);


//changepassword
router.route("/changepassword").put(isAuthenticated, changePassword);

//update profile
router.route("/updateprofile").put(isAuthenticated,updateProfile);

//update profile picture
router.route("/updateprofilepicture").put(isAuthenticated,singleUpload,updateprofilepicture);


 

// admin routes
router.route("/admin/users").get(isAuthenticated,authorizedAdmin,getAllUsers)

router.route("/admin/user/:id").put(isAuthenticated, authorizedAdmin, updateUserRole).delete(isAuthenticated, authorizedAdmin, deleteUser)

router.route("/admin/userUpdate/:id").put(isAuthenticated, singleUpload, authorizedAdmin, updateUser)

router.route("/admin/updateuserimage/:id").put(isAuthenticated, singleUpload, authorizedAdmin, updateUserImage)

router.route("/admin/updateusername/:id").put(isAuthenticated,singleUpload,authorizedAdmin,updateUserName)



export default router;