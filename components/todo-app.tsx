'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { TodoForm } from '@/components/todo-form';
import type { Todo, TodoPriority, TodoStatus } from '@/types/todo';

type FilterKey = 'all' | 'todo' | 'doing' | 'done' | 'overdue' | 'today' | 'high';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(todo: Todo): boolean {
  if (todo.status === 'done') return false;
  if (!todo.dueDate) return false;
  return todo.dueDate < todayISODate();
}

function applyFilter(todos: Todo[], filter: FilterKey): Todo[] {
  switch (filter) {
    case 'todo':
      return todos.filter((t) => t.status === 'todo');
    case 'doing':
      return todos.filter((t) => t.status === 'doing');
    case 'done':
      return todos.filter((t) => t.status === 'done');
    case 'overdue':
      return todos.filter(isOverdue);
    case 'today': {
      const today = todayISODate();
      return todos.filter((t) => t.status !== 'done' && t.dueDate != null && t.dueDate <= today);
    }
    case 'high':
      return todos.filter((t) => t.priority === 'high');
    default:
      return todos;
  }
}

function applySearch(todos: Todo[], query: string): Todo[] {
  const q = query.trim().toLowerCase();
  if (!q) return todos;
  return todos.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.description != null && t.description.toLowerCase().includes(q))
  );
}

type TodoFormValues = {
  title: string;
  description: string;
  dueDate: string;
  priority: TodoPriority;
};

const statusLabelMap = {
  todo: '未着手',
  doing: '進行中',
  done: '完了'
} as const;

const priorityLabelMap = {
  low: '低',
  medium: '中',
  high: '高'
} as const;

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  async function loadTodos() {
    setLoadError(null);

    const response = await fetch('/api/todos');

    if (!response.ok) {
      throw new Error('タスク一覧の取得に失敗しました');
    }

    const data = (await response.json()) as Todo[];
    setTodos(data);
  }

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        await loadTodos();
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'タスク一覧の取得に失敗しました'
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(values: TodoFormValues): Promise<boolean> {
    setIsSubmitting(true);
    setSubmitError(null);
    setActionError(null);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        setSubmitError(errorBody.error ?? 'タスクの追加に失敗しました');
        return false;
      }

      await response.json();
      await loadTodos();
      return true;
    } catch {
      setSubmitError('タスクの追加に失敗しました');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  function getNextStatus(currentStatus: TodoStatus): TodoStatus {
    if (currentStatus === 'done') {
      return 'todo';
    }

    return 'done';
  }

  function toUpdatePayload(todo: Todo, status: TodoStatus) {
    return {
      title: todo.title,
      description: todo.description ?? '',
      dueDate: todo.dueDate ?? '',
      priority: todo.priority,
      status
    };
  }

  async function handleToggleStatus(todo: Todo) {
    setActionError(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(toUpdatePayload(todo, getNextStatus(todo.status)))
      });

      if (!response.ok) {
        throw new Error('タスクの更新に失敗しました');
      }

      await response.json();
      await loadTodos();
    } catch {
      setActionError('タスクの更新に失敗しました');
    }
  }

  async function handleDelete(todoId: string) {
    if (!window.confirm('このタスクを削除しますか？')) {
      return;
    }

    setActionError(null);

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('タスクの削除に失敗しました');
      }

      await loadTodos();
    } catch {
      setActionError('タスクの削除に失敗しました');
    }
  }

  const filteredTodos = applySearch(applyFilter(todos, activeFilter), searchQuery);

  return (
    <section>
      <h1>Simple Todo App</h1>
      <TodoForm
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleCreate}
      />

      <div>
        <label htmlFor="filter-select">絞り込み</label>
        <select
          id="filter-select"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as FilterKey)}
        >
          <option value="all">すべて</option>
          <option value="todo">未着手</option>
          <option value="doing">進行中</option>
          <option value="done">完了</option>
          <option value="overdue">期限切れ</option>
          <option value="today">今日まで</option>
          <option value="high">高優先度</option>
        </select>

        <label htmlFor="search-input">キーワード検索</label>
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? <p>読み込み中...</p> : null}
      {loadError ? <p>{loadError}</p> : null}
      {actionError ? <p>{actionError}</p> : null}

      {!isLoading && !loadError && filteredTodos.length === 0 ? (
        <p>タスクがありません。追加してください</p>
      ) : null}

      {!isLoading && !loadError && filteredTodos.length > 0 ? (
        <ul>
          {filteredTodos.map((todo) => (
            <li key={todo.id}>
              <h2>{todo.title}</h2>
              {isOverdue(todo) ? <span>⚠ 期限切れ</span> : null}
              <p>{todo.description || '─'}</p>
              <p>締切日: {todo.dueDate || '─'}</p>
              <p>優先度: {priorityLabelMap[todo.priority]}</p>
              <p>状態: {statusLabelMap[todo.status]}</p>
              <p>作成日時: {formatCreatedAt(todo.createdAt)}</p>
              <div>
                <button type="button" onClick={() => void handleToggleStatus(todo)}>
                  完了切替
                </button>
                <Link href={`/todos/${todo.id}/edit`}>編集</Link>
                <button type="button" onClick={() => void handleDelete(todo.id)}>
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
