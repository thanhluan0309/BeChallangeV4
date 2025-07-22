const nodemailer = require("nodemailer");

const userMail = process.env.MAIL_USER;
const userPass = process.env.MAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: userMail,
    pass: userPass,
  },
});

const sendMail = (to: string, subject: string, text: string) => {
  console.log("Gửi mail tới:", to, "Tiêu đề:", subject, "Nội dung:", text);
  const mailOptions = {
    from: userMail,
    to,
    subject,
    text,
  };
  return transporter
    .sendMail(mailOptions)
    .then((info: any) => {
      console.log("Gửi mail thành công:", info.response);
      return info;
    })
    .catch((err: any) => {
      console.log("Lỗi gửi mail:", err);
      throw err;
    });
};

export default sendMail;
