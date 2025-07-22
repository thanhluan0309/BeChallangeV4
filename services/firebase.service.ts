import { v4 as uuidv4 } from "uuid";
import { rule, User } from "../models/user.model";
import { Message } from "../models/message.model";
import { Status, Task } from "../models/task.model";
import db from "../db/db";
import randomSixDigit from "../helper/randomSixNum";
import sendMail from "./mail.service";
import { createToken, verifyToken } from "../utils/jwt";

const Dbcollection = db.collection("challangeV4DB");
const RowUser = "user";
const RowAccessToken = "Accesstoken";
const RowMessages = "Messages";
const RowTasks = "Tasks";

export const addUser = async ({
  phone,
  email,
  name,
  role,
}: {
  phone: string;
  email: string;
  name: string;
  role: number;
}) => {
  const userDoc = await Dbcollection.doc(RowUser).get();
  let userData: Record<string, User> = userDoc.exists
    ? (userDoc.data() as Record<string, User>)
    : {};

  const userExits = Object.values(userData).find(
    (u: User) => u.phone === phone || u.email === email
  );
  if (userExits) {
    return null;
  }
  const newId = uuidv4();
  const createdAt = new Date();

  const user: User = {
    userid: newId,
    email: email,
    phone: phone,
    role: role || rule.EMPLOY,
    accessCode: "",
    createdAt,
    name: name || "",
    password: "",
  };

  userData[newId] = user;
  await Dbcollection.doc(RowUser).set(userData, { merge: true });
  return userData[newId];
};

export const getAllUsers = async (): Promise<User[]> => {
  const userDoc = await Dbcollection.doc(RowUser).get();
  if (!userDoc.exists) return [];
  const userData = userDoc.data() as Record<string, User>;
  return Object.entries(userData).map(([id, val]) => ({ ...val, id }));
};

export const updateUser = async (
  userid: string,
  data: Partial<Omit<User, "id" | "createdAt">>
) => {
  const userDoc = await Dbcollection.doc(RowUser).get();
  if (!userDoc.exists) throw new Error("Không tìm thấy user");
  let userData = userDoc.data() as Record<string, User>;
  if (!userData[userid]) throw new Error("User không tồn tại");

  for (const [id, u] of Object.entries(userData)) {
    if (id !== userid) {
      if (data.email && u.email === data.email) {
        return null;
      }
    }
  }
  const updateObj: any = {};
  updateObj[`${userid}`] = { ...userData[userid], ...data };

  await Dbcollection.doc(RowUser).set(updateObj, { merge: true });

  const afterDoc = await Dbcollection.doc(RowUser).get();
  const afterData = afterDoc.data() as Record<string, User>;
  return afterData[userid];
};

export const updatePassword = async (
  userid: string,
  data: Partial<Omit<User, "id" | "createdAt">>
) => {
  const userDoc = await Dbcollection.doc(RowUser).get();
  if (!userDoc.exists) throw new Error("Không tìm thấy user");
  let userData = userDoc.data() as Record<string, User>;
  if (!userData[userid]) throw new Error("User không tồn tại");

  const updateObj: any = {};
  updateObj[`${userid}`] = { ...userData[userid], ...data };

  await Dbcollection.doc(RowUser).set(updateObj, { merge: true });

  const afterDoc = await Dbcollection.doc(RowUser).get();
  const afterData = afterDoc.data() as Record<string, User>;
  return afterData[userid];
};

export const deleteUser = async (userid: string) => {
  const userDoc = await Dbcollection.doc(RowUser).get();
  if (!userDoc.exists) throw new Error("Không tìm thấy user");
  let userData = userDoc.data() as Record<string, User>;
  if (!userData[userid]) throw new Error("User không tồn tại");
  delete userData[userid];
  await Dbcollection.doc(RowUser).set(userData);
};

export const signIn = async ({ email }: { email: string }) => {
  const userDoc = await Dbcollection.doc(RowUser).get();
  let subject = "Xác thực tài khoản";
  let text = "Nội dung mã là : ";
  let userData: Record<string, User> = userDoc.exists
    ? (userDoc.data() as Record<string, User>)
    : {};

  let foundId = "";
  let foundUser = null;
  for (const [id, u] of Object.entries(userData)) {
    if (u.email === email) {
      foundId = id;
      foundUser = u;
      break;
    }
  }
  if (!foundUser) {
    console.log("Không tìm thấy user với email:", email);
    return null;
  }

  const randomCode = randomSixDigit();
  foundUser.accessCode = randomCode;

  userData[foundId] = foundUser;

  try {
    await sendMail(email, subject, text + randomCode);

    await Dbcollection.doc(RowUser).set(userData);

    return foundUser;
  } catch (error) {
    console.log("err ", error);
  }
};

export const verify = async ({
  email,
  accessCode,
  isDemo,
}: {
  email: string;
  accessCode: string;
  isDemo?: boolean;
}) => {
  const userDoc = await Dbcollection.doc(RowUser).get();
  let userData: Record<string, User> = userDoc.exists
    ? (userDoc.data() as Record<string, User>)
    : {};
  let foundId = "";
  let foundUser = null;
  if (isDemo) {
    for (const [id, u] of Object.entries(userData)) {
      if (u.email === email) {
        foundId = id;
        foundUser = u;
        foundUser.accessCode = "";
        break;
      }
    }
  } else {
    for (const [id, u] of Object.entries(userData)) {
      if (u.email === email && u.accessCode === accessCode) {
        foundId = id;
        foundUser = u;
        foundUser.accessCode = "";
        break;
      }
    }
  }

  try {
    if (!foundUser) {
      return null;
    }

    userData[foundId] = foundUser;

    const { token, tokenId } = await createToken(
      foundUser.userid,
      foundUser.role as unknown as string
    );
    const accessTokenRef = await Dbcollection.doc(RowAccessToken);
    accessTokenRef.set(
      {
        [tokenId]: {
          token,
          userid: foundUser.userid,
          role: foundUser.role,
          createdAt: new Date(),
        },
      },
      { merge: true }
    );
    await Dbcollection.doc(RowUser).set(userData);

    return {
      user: foundUser,
      accessToken: token,
      tokenId,
    };
  } catch (error) {
    console.log("err ", error);
    return null;
  }
};

export const getMe = async (token: string) => {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const userDoc = await Dbcollection.doc(RowUser).get();
  if (!userDoc.exists) return null;
  const userData = userDoc.data() as Record<string, User>;
  return userData[decoded.userid];
};

export const addChat = async (msg: Message, info?: any) => {
  const messDoc = await Dbcollection.doc(RowMessages).get();
  let messData: Record<string, Message> = messDoc.exists
    ? (messDoc.data() as Record<string, Message>)
    : {};

  let msgId = msg.id || uuidv4();
  const msgToSave = {
    ...msg,
    id: msgId,
    time: new Date(),
  };

  messData[msgId] = msgToSave;

  try {
    await Dbcollection.doc(RowMessages).set(messData, { merge: true });

    return msgToSave;
  } catch (err) {
    console.log("Lỗi khi add chat:", err);

    return null;
  }
};

export const getMessagesBetween = async (from: string, to: string) => {
  const messDoc = await Dbcollection.doc(RowMessages).get();
  if (!messDoc.exists) return [];
  const messData = messDoc.data() as Record<string, Message>;
  let result: Message[] = [];
  if (from !== to) {
    for (let key in messData) {
      const m = messData[key];
      if (
        (m.from === from && m.to === to) ||
        (m.from === to && m.to === from)
      ) {
        result.push(m);
      }
    }
  } else {
    for (let key in messData) {
      const m = messData[key];
      if (m.from === from && m.to === from) {
        result.push(m);
      }
    }
  }

  result.sort((a: any, b: any) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;

    if (a.time instanceof Date && b.time instanceof Date) {
      return b.time.getTime() - a.time.getTime();
    }

    if (
      a.time &&
      b.time &&
      typeof b.time._seconds === "number" &&
      typeof a.time._seconds === "number"
    ) {
      if (b.time._seconds !== a.time._seconds) {
        return b.time._seconds - a.time._seconds;
      }
      return (b.time._nanoseconds || 0) - (a.time._nanoseconds || 0);
    }

    return 0;
  });

  return result;
};

export const addTask = async ({
  report,
  description,
  assignTo,
}: {
  report: string;
  description: string;
  assignTo: string;
}) => {
  const taskDoc = await Dbcollection.doc(RowTasks).get();
  let taskData: Record<string, Task> = taskDoc.exists
    ? (taskDoc.data() as Record<string, Task>)
    : {};

  const newId = uuidv4();
  const now = new Date();
  const dueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const newTask = {
    id: newId,
    report,
    description,
    assignTo,
    createAt: now,
    dueAt: dueAt,
    status: Status.todo,
  } as Task;

  taskData[newId] = newTask;

  await Dbcollection.doc(RowTasks).set(taskData, { merge: true });

  return newTask;
};

export const getAllTasks = async (): Promise<Task[]> => {
  const taskDoc = await Dbcollection.doc(RowTasks).get();
  if (!taskDoc.exists) return [];
  const taskData = taskDoc.data() as Record<string, Task>;
  let arr: Task[] = [];
  if (taskData) {
    for (const [id, val] of Object.entries(taskData)) {
      arr.push({ ...val, id });
    }
  }
  arr.sort((a, b) => {
    let aTime =
      a.createAt instanceof Date
        ? a.createAt.getTime()
        : new Date(a.createAt).getTime();
    let bTime =
      b.createAt instanceof Date
        ? b.createAt.getTime()
        : new Date(b.createAt).getTime();
    return bTime - aTime;
  });
  return arr;
};

export const updateTask = async (taskId: string, data: Partial<Task>) => {
  const taskDoc = await Dbcollection.doc(RowTasks).get();
  if (!taskDoc.exists) throw new Error("Không tìm thấy task");
  let taskData = taskDoc.data() as Record<string, Task>;
  if (!taskData[taskId]) {
    return null;
  }

  const updateObj: any = {};
  updateObj[`${taskId}`] = { ...taskData[taskId], ...data };

  await Dbcollection.doc(RowTasks).set(updateObj, { merge: true });

  const afterDoc = await Dbcollection.doc(RowTasks).get();
  const afterData = afterDoc.data() as Record<string, Task>;
  let updatedTask = afterData[taskId];
  if (updatedTask && !updatedTask.id) updatedTask.id = taskId;
  return updatedTask;
};

export const deleteTask = async (taskId: string) => {
  console.log("Xóa task:", taskId);
  const taskDoc = await Dbcollection.doc(RowTasks).get();
  if (!taskDoc.exists) throw new Error("Không tìm thấy task");
  let taskData = taskDoc.data() as Record<string, Task>;
  if (!taskData[taskId]) {
    return false;
  }
  delete taskData[taskId];
  await Dbcollection.doc(RowTasks).set(taskData);
  return true;
};

export const checkAccount = async (userid: string) => {
  if (!userid) return null;

  const userDoc = await Dbcollection.doc(RowUser).get();
  if (!userDoc.exists) {
    return null;
  }
  const userData = userDoc.data() as Record<string, any>;

  if (!userData) return null;

  const user = userData[userid];
  console.log("userid ", userid);
  console.log("user ", user);
  if (!user) {
    return null;
  }
  if (user.password) {
    return { redirect: "/" };
  }

  if (!user.userid) user.userid = userid;

  return user;
};
