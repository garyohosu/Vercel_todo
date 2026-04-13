import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '@/lib/db';
import { GET, POST } from '@/app/api/todos/route';

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

describe('/api/todos route', () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns all todos on GET', async () => {
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

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
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
    ]);
  });

  it('returns 500 on GET repository failure', async () => {
    getDbMock.mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error('db failed'))
    });

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Internal server error'
    });
  });

  it('creates a todo on POST', async () => {
    getDbMock.mockReturnValue(
      createDbMock([
        {
          id: '2',
          title: '掃除',
          description: '机',
          status: 'todo',
          priority: 'high',
          due_date: '2026-04-20',
          created_at: '2026-04-13T04:00:00.000Z',
          updated_at: '2026-04-13T04:00:00.000Z'
        }
      ])
    );

    const response = await POST(
      new Request('http://localhost/api/todos', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          title: '掃除',
          description: '机',
          priority: 'high',
          dueDate: '2026-04-20'
        })
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: '2',
      title: '掃除',
      description: '机',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-04-20',
      createdAt: '2026-04-13T04:00:00.000Z',
      updatedAt: '2026-04-13T04:00:00.000Z'
    });
  });

  it('returns 400 on POST validation failure', async () => {
    getDbMock.mockReturnValue(createDbMock([]));

    const response = await POST(
      new Request('http://localhost/api/todos', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          title: '',
          dueDate: '2026-13-99'
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Validation failed',
      fieldErrors: {
        title: 'Title is required',
        dueDate: 'Due date must be a valid date'
      }
    });
  });
});
