'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TodoEditForm } from '@/components/todo-edit-form';
import type { Todo, TodoPriority, TodoStatus } from '@/types/todo';

type TodoEditFormValues = {
  title: string;
  description: string;
  dueDate: string;
  priority: TodoPriority;
  status: TodoStatus;
};

export function TodoEditPage({ id }: { id: string }) {
  const router = useRouter();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTodo() {
      try {
        const response = await fetch(`/api/todos/${id}`);

        if (!response.ok) {
          throw new Error('タスクの取得に失敗しました');
        }

        const data = (await response.json()) as Todo;

        if (active) {
          setTodo(data);
          setLoadError(null);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : 'タスクの取得に失敗しました'
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadTodo();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(values: TodoEditFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        setSubmitError(errorBody.error ?? 'タスクの更新に失敗しました');
        return;
      }

      await response.json();
      router.push('/');
    } catch {
      setSubmitError('タスクの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>読み込み中...</p>;
  }

  if (loadError || !todo) {
    return (
      <section>
        <p>{loadError ?? 'タスクが見つかりません'}</p>
        <button type="button" onClick={() => router.push('/')}>
          一覧に戻る
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>タスク編集</h1>
      <TodoEditForm
        todo={todo}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/')}
      />
    </section>
  );
}
