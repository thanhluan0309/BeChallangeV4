import {
  optionalAuthMiddleware,
  optionalOwnerAuthMiddleware,
} from "../middleware/auth.middleware";

const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.post("/sign", userController.signIn);
router.post("/verify-otp", userController.verifyOtp);
router.post("/check", userController.checkAccount);
router.post(
  "/",
  optionalAuthMiddleware,
  optionalOwnerAuthMiddleware,
  userController.createUser
);
router.get("/", userController.getUsers);
router.put(
  "/update",
  optionalAuthMiddleware,
  optionalOwnerAuthMiddleware,
  userController.updateUser
);

router.put("/updatepass", userController.updatePassword);

router.post(
  "/delete",
  optionalAuthMiddleware,
  optionalOwnerAuthMiddleware,
  userController.deleteUser
);

router.get("/me", optionalAuthMiddleware, userController.getMe);

module.exports = router;
