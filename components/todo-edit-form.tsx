'use client';

import { useState } from 'react';

import { validateUpdateTodoInput } from '@/lib/todo-validation';
import type { Todo, TodoPriority, TodoStatus } from '@/types/todo';

type TodoEditFormValues = {
  title: string;
  description: string;
  dueDate: string;
  priority: TodoPriority;
  status: TodoStatus;
};

type TodoEditFormProps = {
  todo: Todo;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: TodoEditFormValues) => Promise<void>;
  onCancel: () => void;
};

function createInitialValues(todo: Todo): TodoEditFormValues {
  return {
    title: todo.title,
    description: todo.description ?? '',
    dueDate: todo.dueDate ?? '',
    priority: todo.priority,
    status: todo.status
  };
}

export function TodoEditForm({
  todo,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel
}: TodoEditFormProps) {
  const [values, setValues] = useState<TodoEditFormValues>(() =>
    createInitialValues(todo)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateUpdateTodoInput(values);

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    await onSubmit(values);
  }

  function updateField<Key extends keyof TodoEditFormValues>(
    key: Key,
    value: TodoEditFormValues[Key]
  ) {
    setValues((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">タスク名</label>
        <input
          id="title"
          name="title"
          value={values.title}
          onChange={(event) => updateField('title', event.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.title ? <p>{fieldErrors.title}</p> : null}
      </div>

      <div>
        <label htmlFor="description">説明</label>
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={(event) => updateField('description', event.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.description ? <p>{fieldErrors.description}</p> : null}
      </div>

      <div>
        <label htmlFor="dueDate">締切日</label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          value={values.dueDate}
          onChange={(event) => updateField('dueDate', event.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.dueDate ? <p>{fieldErrors.dueDate}</p> : null}
      </div>

      <div>
        <label htmlFor="priority">優先度</label>
        <select
          id="priority"
          name="priority"
          value={values.priority}
          onChange={(event) =>
            updateField('priority', event.target.value as TodoPriority)
          }
          disabled={isSubmitting}
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
        {fieldErrors.priority ? <p>{fieldErrors.priority}</p> : null}
      </div>

      <div>
        <label htmlFor="status">状態</label>
        <select
          id="status"
          name="status"
          value={values.status}
          onChange={(event) => updateField('status', event.target.value as TodoStatus)}
          disabled={isSubmitting}
        >
          <option value="todo">未着手</option>
          <option value="doing">進行中</option>
          <option value="done">完了</option>
        </select>
        {fieldErrors.status ? <p>{fieldErrors.status}</p> : null}
      </div>

      {submitError ? <p>{submitError}</p> : null}

      <div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : '保存する'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </button>
      </div>
    </form>
  );
}
