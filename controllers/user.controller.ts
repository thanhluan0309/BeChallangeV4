const userService = require("../services/firebase.service");
import { rule, User } from "../models/user.model";

// đại ca ơi, gán type cho req, res cho chuẩn TypeScript
import { Request, Response } from "express";
import {
  addUser,
  checkAccount,
  getMe,
  signIn,
  verify,
} from "../services/firebase.service";
import sendMail from "../services/mail.service";
import { URL_FE } from "../constants/urlFe";
import { encode } from "../utils/encode";

const scecretKey = "v4";

exports.getMe = async (req: Request, res: Response) => {
  const token = req.headers.authorization || "";
  const gtoken = token.split(" ")[1];

  if (!gtoken)
    return res.status(401).json({ ok: 0, success: false, msg: "Thiếu token" });
  const me = await getMe(gtoken);

  res.json({ ok: 1, success: true, me });
};

exports.checkAccount = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(401).json({ ok: 0, success: false, msg: "Thiếu token" });
  }

  const getAccount = await checkAccount(id);
  if (!getAccount) {
    return res.status(404).json({
      ok: 1,
      success: false,
      msg: "tài khoản không tồn tại trên hệ thông",
    });
  }
  if (getAccount?.redirect) {
    return res.status(200).json({
      ok: 1,
      success: true,
      msg: "Tài khoản đã access rồi",
      router: getAccount?.redirect,
    });
  }
  return res
    .status(200)
    .json({ ok: 1, success: true, msg: "Có user này", user: getAccount });
};

exports.signIn = async (req: Request, res: Response) => {
  const { email } = req.body as User;

  if (!email) {
    return res
      .status(400)
      .json({ ok: 0, success: false, msg: "Thiếu field mail" });
  }
  try {
    const newSignIn = await signIn({ email });

    if (!newSignIn) {
      return res.json({ ok: 1, success: false, msg: "mail không tồn tại !!" });
    }

    return res.json({ ok: 1, success: true, msg: "Mã OTP đã được gửi " });
  } catch (err: any) {
    // log lỗi cho đại ca dễ debug
    console.log("Lỗi tạo user:", err);
    res.status(500).json({ ok: 0, err: err.message });
  }
};

exports.verifyOtp = async (req: Request, res: Response) => {
  // lấy email, accessCode với isDemo từ body, thiếu thì thôi khỏi check
  const { email, accessCode, isDemo } = req.body;

  if (!email || !accessCode) {
    return res
      .status(400)
      .json({ ok: 0, success: false, msg: "Thiếu field mail || accessCode" });
  }
  try {
    const isValidToken = await verify({ email, accessCode, isDemo });

    if (!isValidToken) {
      return res.json({
        ok: 1,
        success: false,
        msg: "Mã OTP không hợp lệ !!",
      });
    }

    return res.json({
      ok: 1,
      success: true,
      msg: "Xác thực thành công",
      info: isValidToken,
    });
  } catch (err: any) {
    // log lỗi cho đại ca dễ debug
    console.log("Lỗi tạo user:", err);
    res.status(500).json({ ok: 0, err: err.message });
  }
};

exports.createUser = async (req: Request, res: Response) => {
  const { phone, email, role, name } = req.body as User;

  if (!email) {
    return res.status(400).json({ ok: 0, success: false, msg: "Thiếu email" });
  }
  try {
    const newUser = await addUser({ phone, email, name, role });
    if (!newUser) {
      return res.json({
        ok: 1,
        success: false,
        msg: "Email hoặc Số điện thoại đã tồn tại",
      });
    }

    const idEncode = encode(newUser.userid, scecretKey);
    const subject = "Thông báo set up account";
    const text =
      "Vui lòng truy cập đường dẫn : " + URL_FE + "/verify/" + idEncode;
    await sendMail(newUser.email, subject, text);
    res.json({ ok: 1, success: true, newUser: newUser });
  } catch (err: any) {
    // log lỗi cho đại ca dễ debug
    console.log("Lỗi tạo user:", err);
    res.status(500).json({ ok: 0, err: err.message });
  }
};

exports.getUsers = async (req: Request, res: Response) => {
  // lấy danh sách user, trả về mảng User
  try {
    const users: User[] = await userService.getAllUsers();
    res.json({ ok: 1, data: users });
  } catch (err: any) {
    // lỗi thì trả về cho đại ca biết
    console.log("Lỗi lấy user:", err);
    res.status(500).json({ ok: 0, err: err.message });
  }
};

exports.updateUser = async (req: Request, res: Response) => {
  // lấy body kiểu Partial<User> cho chắc cú
  const { phone, userid, name, email, role } = req.body as Partial<User>;

  if (!userid) return res.status(400).json({ ok: 0, msg: "Thiếu id user" });
  if (!phone)
    return res.status(400).json({ ok: 0, msg: "Không có dữ liệu để update" });
  try {
    // update chỉ truyền field cần update thôi
    const data = await userService.updateUser(userid, {
      phone,
      userid,
      name,
      email,
      role,
    } as Partial<User>);
    if (!data) {
      return res
        .status(409)
        .json({ ok: 0, success: false, msg: "Mail đã tồn tại" });
    }
    return res.json({ ok: 1, success: true, data });
  } catch (err: any) {
    // log lỗi cho đại ca
    console.log("Lỗi update user:", err);
    res.status(500).json({ ok: 0, err: err.message });
  }
};

exports.updatePassword = async (req: Request, res: Response) => {
  // lấy body kiểu Partial<User> cho chắc cú
  const { userid, password } = req.body as Partial<User>;

  if (!userid) return res.status(400).json({ ok: 0, msg: "Thiếu id user" });

  try {
    // update chỉ truyền field cần update thôi
    const data = await userService.updatePassword(userid, {
      password,
    } as Partial<User>);

    return res.json({ ok: 1, success: true, data });
  } catch (err: any) {
    // log lỗi cho đại ca
    console.log("Lỗi update user:", err);
    res.status(500).json({ ok: 0, err: err.message });
  }
};

exports.deleteUser = async (req: Request, res: Response) => {
  const { userid } = req.body as Partial<User>;
  if (!userid) return res.status(400).json({ ok: 0, msg: "Thiếu id user" });
  try {
    await userService.deleteUser(userid);
    res.json({ ok: 1, success: true, msg: "Xóa user thành công" });
  } catch (err: any) {
    // lỗi thì log ra cho đại ca xử lý
    console.log("Lỗi xóa user:", err);
    res.status(500).json({ ok: 0, err: err.message });
  }
};
