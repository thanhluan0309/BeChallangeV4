import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { getMe } from "../services/firebase.service";
import { rule } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userid?: string;
    }
  }
}

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ ok: 0, success: false, msg: "Thiếu token" });
    }
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await getMe(token);
        if (user) {
          req.user = user;
          req.userid = decoded.userid;
          (req as any).dataDecoded = user;
          next();
        } else {
          return res.status(403).json({
            ok: 0,
            success: false,
            msg: "Token không hợp lệ cho tài khoản này",
          });
        }
      }
    }
  } catch (error) {
    console.log("Lỗi optional auth middleware:", error);
  }
};

// middleware optional auth (không bắt buộc phải có token)
export const optionalOwnerAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ ok: 0, success: false, msg: "Thiếu token" });
    }
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await getMe(token);
        if (user) {
          if (user.role === rule.OWNER) {
            next();
            return;
          }
          return res.status(403).json({
            ok: 0,
            success: false,
            msg: "Tài khoản này không có quyền truy cập",
          });
        }
        {
          return res.status(404).json({
            ok: 0,
            success: false,
            msg: "Tài khoản này không tồn tại",
          });
        }
      }
    }
  } catch (error) {
    console.log("Lỗi optional auth middleware:", error);
  }
};
