export enum rule {
  OWNER = 0,
  EMPLOY = 1,
}

export interface User {
  userid: string;
  phone: string;
  email: string;
  role: rule;
  accessCode: string;
  createdAt: Date;
  name: string;
  password: string;
}
