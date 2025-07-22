import { Request, Response } from "express";
import { addChat, getMessagesBetween } from "../services/firebase.service";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";

exports.addChat = async (req: Request, res: Response) => {
  const { to, msg } = req.body;
  const dataDecoded = (req as any).dataDecoded as User;
  if (!to || !msg) {
    return res.status(400).json({
      ok: 0,
      success: false,
      msg: "Thiếu trường 'to' hoặc 'msg' nha đại ca",
    });
  }
  const mess = {
    from: dataDecoded.userid,
    to: to,
    msg: msg,
  } as Message;

  const chatRef = await addChat(mess, dataDecoded);

  res.json({ ok: 1, success: true, data: chatRef });
};

exports.getChatFT = async (req: Request, res: Response) => {
  const { from, to } = req.body;
  if (!to || !from) {
    return res.status(400).json({
      ok: 0,
      success: false,
      msg: "Thiếu trường 'to' hoặc 'from' ",
    });
  }

  const chatRef = await getMessagesBetween(from, to);

  res.json({ ok: 1, success: true, chat: chatRef });
};
