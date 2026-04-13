import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TodoApp } from '@/components/todo-app';

describe('TodoApp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the empty state after loading todos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      })
    );

    render(<TodoApp />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('タスクがありません。追加してください')).toBeInTheDocument();
    });
  });

  it('creates a todo and refreshes the visible list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          title: '買い物',
          description: null,
          status: 'todo',
          priority: 'medium',
          dueDate: null,
          createdAt: '2026-04-13T03:00:00.000Z',
          updatedAt: '2026-04-13T03:00:00.000Z'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            title: '買い物',
            description: null,
            status: 'todo',
            priority: 'medium',
            dueDate: null,
            createdAt: '2026-04-13T03:00:00.000Z',
            updatedAt: '2026-04-13T03:00:00.000Z'
          }
        ]
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoApp />);

    await screen.findByText('タスクがありません。追加してください');

    await userEvent.type(screen.getByLabelText('タスク名'), '買い物');
    await userEvent.click(screen.getByRole('button', { name: '追加する' }));

    await waitFor(() => {
      expect(screen.getByText('買い物')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '買い物',
        description: '',
        dueDate: '',
        priority: 'medium'
      })
    });
  });

  it('toggles a todo to done from the list and refreshes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            title: '買い物',
            description: null,
            status: 'todo',
            priority: 'medium',
            dueDate: null,
            createdAt: '2026-04-13T03:00:00.000Z',
            updatedAt: '2026-04-13T03:00:00.000Z'
          }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          title: '買い物',
          description: null,
          status: 'done',
          priority: 'medium',
          dueDate: null,
          createdAt: '2026-04-13T03:00:00.000Z',
          updatedAt: '2026-04-13T04:00:00.000Z'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            title: '買い物',
            description: null,
            status: 'done',
            priority: 'medium',
            dueDate: null,
            createdAt: '2026-04-13T03:00:00.000Z',
            updatedAt: '2026-04-13T04:00:00.000Z'
          }
        ]
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoApp />);

    await screen.findByText('買い物');
    await userEvent.click(screen.getByRole('button', { name: '完了切替' }));

    await waitFor(() => {
      expect(screen.getByText('状態: 完了')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/todos/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '買い物',
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'done'
      })
    });
  });

  it('deletes a todo after confirmation and refreshes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            title: '買い物',
            description: null,
            status: 'todo',
            priority: 'medium',
            dueDate: null,
            createdAt: '2026-04-13T03:00:00.000Z',
            updatedAt: '2026-04-13T03:00:00.000Z'
          }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    render(<TodoApp />);

    await screen.findByText('買い物');
    await userEvent.click(screen.getByRole('button', { name: '削除' }));

    await waitFor(() => {
      expect(screen.getByText('タスクがありません。追加してください')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/todos/1', {
      method: 'DELETE'
    });
  });
});
