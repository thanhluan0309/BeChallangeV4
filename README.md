# 📦 BeChallangeV4 - Backend Structure Overview

> Dự án backend được build bằng Node.js + Express + TypeScript. File này cung cấp hướng dẫn setup và mô tả đầy đủ cấu trúc project.

---

## 🚀 Cách chạy dự án (Setup nhanh)

### ✅ Bước 1: Chuẩn bị file cấu hình

- Đặt 2 file sau vào thư mục gốc dự án: ( 2 file này đã được gửi đính kèm ) 
  - `.env`
  - `firebase.json`
 
### ✅ Bước 2: Cài dependencies

```bash
npm install

```
### ✅ Bước 3: Chạy dự án

```bash
npm run dev

```

## 🧭 Mục lục

- [📁 Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [🧩 Giải thích chức năng từng thư mục](#giải-thích-chức-năng-từng-thư-mục)
- [🔁 Flow xử lý chung](#flow-xử-lý-chung)
- [🛠 Tech stack chính](#tech-stack-chính)
- [📌 Ghi chú triển khai](#ghi-chú-triển-khai)

---

## 📁 Cấu trúc thư mục

```bash
src/
├── controllers/
│   ├── auth.controller.ts        # Xử lý logic auth: login, register, refreshToken,...
│   ├── user.controller.ts        # Logic liên quan user: profile, info,...
│   └── xxx.controller.ts         # Các controller khác
├── services/                     # Business logic hoặc xử lý chuyên sâu tách khỏi controller
├── models/                       # Định nghĩa schema cho DB (MongoDB hoặc ORM)
├── routes/                       # Khai báo route và mapping tới controller
├── middlewares/                 # Các middleware: auth, validation, errorHandler,...
├── utils/                        # Hàm tiện ích như genToken, hashPassword,...
└── config/                       # Config database, biến môi trường, ...
