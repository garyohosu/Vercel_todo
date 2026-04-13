import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '@/lib/db';
import { DELETE, GET, PUT } from '@/app/api/todos/[id]/route';

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn<() => DatabaseClient>()
}));

vi.mock('@/lib/db', () => ({
  getDb: getDbMock
}));

function createDbMock(rows: unknown[] = []) {
  return {
    query: vi.fn().mockResolvedValue(rows)
  } satisfies DatabaseClient;
}

describe('/api/todos/[id] route', () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns one todo on GET', async () => {
    getDbMock.mockReturnValue(
      createDbMock([
        {
          id: '1',
          title: '買い物',
          description: null,
          status: 'todo',
          priority: 'medium',
          due_date: null,
          created_at: '2026-04-13T03:00:00.000Z',
          updated_at: '2026-04-13T03:00:00.000Z'
        }
      ])
    );

    const response = await GET(new Request('http://localhost/api/todos/1'), {
      params: Promise.resolve({ id: '1' })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: '1',
      title: '買い物',
      description: null,
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      createdAt: '2026-04-13T03:00:00.000Z',
      updatedAt: '2026-04-13T03:00:00.000Z'
    });
  });

  it('returns 404 when GET target does not exist', async () => {
    getDbMock.mockReturnValue(createDbMock([]));

    const response = await GET(new Request('http://localhost/api/todos/999'), {
      params: Promise.resolve({ id: '999' })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Not found'
    });
  });

  it('updates a todo on PUT', async () => {
    getDbMock.mockReturnValue(
      createDbMock([
        {
          id: '1',
          title: '買い物',
          description: '牛乳',
          status: 'doing',
          priority: 'high',
          due_date: '2026-04-20',
          created_at: '2026-04-13T03:00:00.000Z',
          updated_at: '2026-04-13T04:00:00.000Z'
        }
      ])
    );

    const response = await PUT(
      new Request('http://localhost/api/todos/1', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          title: '買い物',
          description: '牛乳',
          priority: 'high',
          dueDate: '2026-04-20',
          status: 'doing'
        })
      }),
      {
        params: Promise.resolve({ id: '1' })
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: '1',
      title: '買い物',
      description: '牛乳',
      status: 'doing',
      priority: 'high',
      dueDate: '2026-04-20',
      createdAt: '2026-04-13T03:00:00.000Z',
      updatedAt: '2026-04-13T04:00:00.000Z'
    });
  });

  it('returns 400 on PUT validation failure', async () => {
    getDbMock.mockReturnValue(createDbMock([]));

    const response = await PUT(
      new Request('http://localhost/api/todos/1', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          title: '',
          priority: 'medium',
          status: 'paused'
        })
      }),
      {
        params: Promise.resolve({ id: '1' })
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Validation failed',
      fieldErrors: {
        title: 'Title is required',
        status: 'Status must be todo, doing, or done'
      }
    });
  });

  it('returns 404 when PUT target does not exist', async () => {
    getDbMock.mockReturnValue(createDbMock([]));

    const response = await PUT(
      new Request('http://localhost/api/todos/999', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          title: '買い物',
          description: '',
          priority: 'medium',
          dueDate: '',
          status: 'todo'
        })
      }),
      {
        params: Promise.resolve({ id: '999' })
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Not found'
    });
  });

  it('deletes a todo on DELETE', async () => {
    getDbMock.mockReturnValue(createDbMock([{ id: '1' }]));

    const response = await DELETE(
      new Request('http://localhost/api/todos/1', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: '1' })
      }
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('');
  });

  it('returns 404 when DELETE target does not exist', async () => {
    getDbMock.mockReturnValue(createDbMock([]));

    const response = await DELETE(
      new Request('http://localhost/api/todos/999', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: '999' })
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Not found'
    });
  });
});
