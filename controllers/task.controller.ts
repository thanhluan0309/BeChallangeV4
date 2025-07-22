import { Request, Response } from "express";

import {
  addTask,
  getAllTasks,
  updateTask,
  deleteTask,
  addChat,
} from "../services/firebase.service";
import { User } from "../models/user.model";
import { Task } from "../models/task.model";
import { Message } from "firebase-admin/lib/messaging/messaging-api";

exports.createTask = async (req: Request, res: Response) => {
  const { description, assignTo } = req.body as Task;
  const dataDecoded = (req as any).dataDecoded as User;
  if (!description || !assignTo) {
    return res.status(400).json({
      ok: 0,
      msg: "Thiếu Description hoặc assignTo nha đại ca",
    });
  }
  try {
    const newTask = await addTask({
      report: dataDecoded.userid,
      description,
      assignTo,
    });
    res.json({ ok: 1, success: true, task: newTask });
  } catch (err) {
    console.log("Lỗi khi tạo task:", err);
    res.status(500).json({ ok: 0, msg: "Tạo task thất bại" });
  }
};

exports.getTasks = async (req: Request, res: Response) => {
  try {
    let tasks = await getAllTasks();
    tasks = tasks.filter((t) => !!t);
    res.json({ ok: 1, tasks });
  } catch (err) {
    console.log("Lỗi khi lấy tasks:", err);
    res.status(500).json({ ok: 0, msg: "Không lấy được tasks" });
  }
};

exports.updateTask = async (req: Request, res: Response) => {
  const { description, assignTo, status, id } = req.body as Partial<Task>;

  if (!id) {
    return res.status(400).json({ ok: 0, msg: "Thiếu id task để update" });
  }

  try {
    const updated = await updateTask(id, {
      description,
      assignTo,
      status,
    });
    if (!updated) {
      return res.status(404).json({ ok: 0, msg: "Task không tồn tại" });
    }
    return res.json({ ok: 1, success: true, task: updated });
  } catch (err: any) {
    console.log("Lỗi update task:", err);
    res.status(500).json({ ok: 0, msg: "Update task thất bại" });
  }
};

exports.deleteTask = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ ok: 0, msg: "Thiếu id task để xóa" });
  }
  try {
    await deleteTask(id);
    res.json({ ok: 1, success: true, msg: "Xóa task thành công" });
  } catch (err: any) {
    console.log("Lỗi xóa task:", err);
    res.status(500).json({ ok: 0, msg: "Xóa task thất bại" });
  }
};
