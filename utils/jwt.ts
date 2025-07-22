// Đại ca, utils JWT để tạo và verify token nha
import jwt from "jsonwebtoken";
import db from "../db/db";

const JWT_SECRET = process.env.JWT_SECRET || "challengev4_secret_key"; // TODO: cho vào env nếu làm thật
const Dbcollection = db.collection("challangeV4DB");
const RowAccessToken = "Accesstoken";

// interface cho token data
interface TokenData {
  id: string; // token id tự tạo
  userid: string;
  role: string;
  createdAt: Date;
}

// tạo token và lưu vào db
export const createToken = async (userid: string, role: string) => {
  try {
    // tạo payload cho JWT
    const payload = { userid, role };
    // tạo JWT token, hết hạn 7 ngày
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // tạo token data để lưu vào db
    const tokenId = `token_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const tokenData: TokenData = {
      id: tokenId,
      userid,
      role,
      createdAt: new Date(),
    };

    // lấy doc access token
    const tokenDoc = await Dbcollection.doc(RowAccessToken).get();
    let tokenList: Record<string, TokenData> = tokenDoc.exists
      ? (tokenDoc.data() as Record<string, TokenData>)
      : {};

    // thêm token mới vào list
    tokenList[tokenId] = tokenData;

    // lưu lại vào db
    await Dbcollection.doc(RowAccessToken).set(tokenList, { merge: true });

    // log thử cho đại ca
    console.log("Đã tạo token cho user:", userid, "Token ID:", tokenId);

    return { token, tokenId };
  } catch (err) {
    console.log("Lỗi tạo token:", err);
    throw err;
  }
};

// verify token, fix vụ decoded vẫn log ra mà vẫn báo invalid
export const verifyToken = (token: string) => {
  if (!token) {
    return null;
  }

  let decoded: any = null;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err: any) {
    return null;
  }

  if (!decoded || !decoded.userid) {
    return null;
  }
  return decoded;
};

// xóa token (logout)
export const deleteToken = async (tokenId: string) => {
  try {
    const tokenDoc = await Dbcollection.doc(RowAccessToken).get();
    if (!tokenDoc.exists) return false;

    let tokenList: Record<string, TokenData> = tokenDoc.data() as Record<
      string,
      TokenData
    >;
    delete tokenList[tokenId];

    await Dbcollection.doc(RowAccessToken).set(tokenList);
    console.log("Đã xóa token:", tokenId);
    return true;
  } catch (err) {
    console.log("Lỗi xóa token:", err);
    return false;
  }
};
