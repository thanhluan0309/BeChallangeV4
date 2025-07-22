// Đại ca ơi, fix lại vụ init firebase cho chuẩn, không lấy nhầm serviceAccount nữa

import express from "express";
import { createServer } from "http";
const { Server } = require("socket.io");
require("dotenv").config();
import db from "./db/db";
const chatCollection = db.collection("messages");
import cors from "cors";
import {
  addChat,
  addTask,
  getAllTasks,
  getMessagesBetween,
} from "./services/firebase.service";
import { Message } from "./models/message.model";
import { Task } from "./models/task.model";
import { URL_FE } from "./constants/urlFe";

const userRoute = require("./routes/user.route");
const messRoute = require("./routes/mess.route");
const taskRoute = require("./routes/task.route");

const app = express();
const port = 3000;

const corsOptions = {
  origin: [URL_FE],
  credentials: true,
};

app.use(cors(corsOptions));

// parse body json
app.use(express.json());

// import route user
app.use("/user", userRoute);
app.use("/chat", messRoute);
app.use("/task", taskRoute);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // cho phép mọi origin, test cho lẹ
  },
});

io.on("connection", async (socket: any) => {
  socket.on("join-room", (roomId: any) => {
    socket.join(roomId);
    console.log(socket.id + " Tham gia room : ", roomId);
  });

  // Bên FE .emit("message", message) thì ở đây phải lắng nghe nè
  socket.on("message", async (message: Message, roomId: string) => {
    const rs = await addChat(message);
    if (rs?.from && rs.time) {
      // Gửi tin nhắn mới cho tất cả client trong room
      io.to(roomId).emit("new-message", rs);
    }
  });

  socket.on("get-chat", async (message: Message, roomId: string) => {
    if (message?.from && message?.to) {
      try {
        // lỡ đâu thiếu from/to thì thôi gửi mảng rỗng
        const rs = await getMessagesBetween(
          message.from || "",
          message.to || ""
        );

        io.to(roomId).emit("get-chat", rs);
      } catch (err) {
        // log lỗi cho đại ca dễ debug
        console.log("Lỗi lấy messages giữa 2 user:", err);
        socket.emit("get-chat", []);
      }
    }
  });

  socket.on("chat", async (data: any) => {
    const msgObj = {
      from: socket.id,
      msg: data.msg,
      time: new Date(),
    };
    try {
      // Lưu vào Firestore
      await chatCollection.add(msgObj);
      // log lưu thành công
      console.log("Đã lưu message vào Firestore", msgObj);
    } catch (err) {
      console.log("Lỗi lưu message Firestore:", err);
    }
    // Broadcast cho các client khác
    socket.broadcast.emit("chat", msgObj);
  });

  socket.on("add-task", async (task: Task, roomId: string) => {
    const rs = await addTask(task);
    if (rs?.id) {
      // Gửi tin nhắn mới cho tất cả client trong room
      io.to(roomId).emit("new-task", rs);
    }
  });

  socket.on("get-task", async (roomId: string) => {
    try {
      // lỡ đâu thiếu from/to thì thôi gửi mảng rỗng
      const rs = await getAllTasks();
      console.log("roomId ", roomId);
      io.to(roomId).emit("get-task", rs);
    } catch (err) {
      // log lỗi cho đại ca dễ debug
      console.log("Lỗi lấy messages giữa 2 user:", err);
      socket.emit("get-chat", []);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnect", socket.id);
  });
});

// start server
httpServer.listen(port, () => {
  // log này để biết server đã chạy
  console.log("Server chạy ở port", port);
});
