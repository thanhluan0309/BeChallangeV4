// encode đơn giản thôi, truyền key vô cho chắc cú, khỏi ai decode bậy bạ
export const encode = (str: string, key: string): string => {
  if (!str || !key) return "";
  // XOR từng ký tự với key, rồi base64 cho lẹ
  let result = "";
  for (let i = 0; i < str.length; i++) {
    // lấy ký tự key, lặp lại nếu key ngắn
    let k = key.charCodeAt(i % key.length);
    let s = str.charCodeAt(i);
    // XOR cho vui
    result += String.fromCharCode(s ^ k);
  }
  // encode base64
  let buff = Buffer.from(result, "utf-8");
  // log thử cho đại ca xem encode ra gì
  // console.log("Encode xong:", buff.toString("base64"));
  return buff.toString("base64");
};

// decode lại, cũng phải truyền key vô, không là bó tay
export const decode = (encoded: string, key: string): string => {
  if (!encoded || !key) return "";
  try {
    let buff = Buffer.from(encoded, "base64");
    let str = buff.toString("utf-8");
    let result = "";
    for (let i = 0; i < str.length; i++) {
      let k = key.charCodeAt(i % key.length);
      let s = str.charCodeAt(i);
      // XOR lại là ra
      result += String.fromCharCode(s ^ k);
    }
    // log thử decode ra gì
    // console.log("Decode xong:", result);
    return result;
  } catch (err) {
    // lỗi thì trả về chuỗi rỗng cho đại ca khỏi lo
    // console.log("Decode lỗi:", err);
    return "";
  }
};
