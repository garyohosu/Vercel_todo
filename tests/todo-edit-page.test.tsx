import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

import { TodoEditPage } from '@/components/todo-edit-page';

describe('TodoEditPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
  });

  it('loads an existing todo and updates it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          title: '買い物',
          description: '牛乳',
          status: 'todo',
          priority: 'medium',
          dueDate: '2026-04-20',
          createdAt: '2026-04-13T03:00:00.000Z',
          updatedAt: '2026-04-13T03:00:00.000Z'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          title: '買い物更新',
          description: '牛乳',
          status: 'doing',
          priority: 'high',
          dueDate: '2026-04-21',
          createdAt: '2026-04-13T03:00:00.000Z',
          updatedAt: '2026-04-13T04:00:00.000Z'
        })
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoEditPage id="1" />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('買い物')).toBeInTheDocument();
    });

    await userEvent.clear(screen.getByLabelText('タスク名'));
    await userEvent.type(screen.getByLabelText('タスク名'), '買い物更新');
    await userEvent.selectOptions(screen.getByLabelText('優先度'), 'high');
    await userEvent.selectOptions(screen.getByLabelText('状態'), 'doing');
    await userEvent.clear(screen.getByLabelText('締切日'));
    await userEvent.type(screen.getByLabelText('締切日'), '2026-04-21');
    await userEvent.click(screen.getByRole('button', { name: '保存する' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/todos/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '買い物更新',
        description: '牛乳',
        dueDate: '2026-04-21',
        priority: 'high',
        status: 'doing'
      })
    });
  });
});
