'use client';

import { useState } from 'react';

import type { TodoPriority } from '@/types/todo';
import { validateCreateTodoInput } from '@/lib/todo-validation';

type TodoFormValues = {
  title: string;
  description: string;
  dueDate: string;
  priority: TodoPriority;
};

type TodoFormProps = {
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: TodoFormValues) => Promise<boolean>;
};

const initialValues: TodoFormValues = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium'
};

export function TodoForm({ isSubmitting, submitError, onSubmit }: TodoFormProps) {
  const [values, setValues] = useState<TodoFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateTodoInput(values);

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    const didCreate = await onSubmit(values);

    if (didCreate) {
      setValues(initialValues);
    }
  }

  function updateField<Key extends keyof TodoFormValues>(
    key: Key,
    value: TodoFormValues[Key]
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

      {submitError ? <p>{submitError}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '追加中...' : '追加する'}
      </button>
    </form>
  );
}
