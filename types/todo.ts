export const TODO_STATUS = ['todo', 'doing', 'done'] as const;
export const TODO_PRIORITY = ['low', 'medium', 'high'] as const;

export type TodoStatus = (typeof TODO_STATUS)[number];
export type TodoPriority = (typeof TODO_PRIORITY)[number];

export type Todo = {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TodoRow = {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTodoInput = {
  title: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: string;
};

export type CreateTodoValues = {
  title: string;
  description: string | null;
  priority: TodoPriority;
  dueDate: string | null;
};

export type UpdateTodoInput = {
  title: string;
  description?: string;
  priority: TodoPriority;
  dueDate?: string;
  status: TodoStatus;
};

export type UpdateTodoValues = {
  title: string;
  description: string | null;
  priority: TodoPriority;
  dueDate: string | null;
  status: TodoStatus;
};
