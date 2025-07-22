import { optionalAuthMiddleware } from "../middleware/auth.middleware";

const express = require("express");
const router = express.Router();
const messController = require("../controllers/mess.controller");

router.post("/", optionalAuthMiddleware, messController.addChat);
router.post("/get-chat", optionalAuthMiddleware, messController.getChatFT);

module.exports = router;
