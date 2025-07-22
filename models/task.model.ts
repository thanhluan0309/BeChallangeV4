export enum Status {
  inprogess = 0,
  todo = 1,
  done = 2,
  cancel = 3,
}

export interface Task {
  id: string;
  assignTo: string;
  report: string;
  description: string;
  createAt: Date;
  dueAt: Date;
  status: Status;
}
