import {
  optionalAuthMiddleware,
  optionalOwnerAuthMiddleware,
} from "../middleware/auth.middleware";

const express = require("express");
const router = express.Router();
const userController = require("../controllers/task.controller");

router.post(
  "/task",
  optionalAuthMiddleware,
  optionalOwnerAuthMiddleware,
  userController.createTask
);

router.get("/task", optionalAuthMiddleware, userController.getTasks);

router.put("/task", optionalAuthMiddleware, userController.updateTask);

router.post(
  "/delete",
  optionalAuthMiddleware,
  optionalOwnerAuthMiddleware,
  userController.deleteTask
);

module.exports = router;
