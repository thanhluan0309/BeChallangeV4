const nodeFetch = require("node-fetch");

function sendTextbeltSMS(to: string, msg: string) {
  console.log("Gửi SMS Textbelt tới:", to, "Nội dung:", msg);
  return nodeFetch("https://textbelt.com/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: to,
      message: msg,
      key: "textbelt",
    }),
  })
    .then((res: any) => res.json())
    .then((data: any) => {
      console.log("Kết quả gửi SMS:", data);
      return data;
    })
    .catch((err: any) => {
      console.log("Lỗi gửi SMS Textbelt:", err);
      throw err;
    });
}

module.exports = { sendTextbeltSMS };
