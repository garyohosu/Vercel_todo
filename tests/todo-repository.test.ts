import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '@/lib/db';
import { TodoRepository } from '@/lib/todo-repository';
import type { TodoRow } from '@/types/todo';

function createDbMock(rows: unknown[] = []) {
  return {
    query: vi.fn().mockResolvedValue(rows)
  } satisfies DatabaseClient;
}

describe('TodoRepository', () => {
  it('returns mapped todos from findAll using the required ordering', async () => {
    const db = createDbMock([
      {
        id: '1',
        title: '買い物',
        description: '牛乳',
        status: 'todo',
        priority: 'medium',
        due_date: '2026-04-14',
        created_at: '2026-04-13T01:00:00.000Z',
        updated_at: '2026-04-13T01:00:00.000Z'
      } satisfies TodoRow
    ]);
    const repository = new TodoRepository(db);

    const result = await repository.findAll();

    expect(db.query).toHaveBeenCalledTimes(1);
    const [sqlText, params] = vi.mocked(db.query).mock.calls[0];
    expect(sqlText).toContain("ORDER BY CASE WHEN status = 'done' THEN 1 ELSE 0 END,");
    expect(sqlText).toContain('due_date ASC NULLS LAST,');
    expect(sqlText).toContain('created_at DESC');
    expect(params).toEqual([]);
    expect(result).toEqual([
      {
        id: '1',
        title: '買い物',
        description: '牛乳',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-04-14',
        createdAt: '2026-04-13T01:00:00.000Z',
        updatedAt: '2026-04-13T01:00:00.000Z'
      }
    ]);
  });

  it('creates a todo with default todo status', async () => {
    const db = createDbMock([
      {
        id: '2',
        title: '掃除',
        description: null,
        status: 'todo',
        priority: 'high',
        due_date: '2026-04-15',
        created_at: '2026-04-13T02:00:00.000Z',
        updated_at: '2026-04-13T02:00:00.000Z'
      } satisfies TodoRow
    ]);
    const repository = new TodoRepository(db);

    const result = await repository.create({
      title: '掃除',
      description: null,
      priority: 'high',
      dueDate: '2026-04-15'
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'INSERT INTO todos (title, description, status, priority, due_date)'
      ),
      ['掃除', null, 'todo', 'high', '2026-04-15']
    );
    expect(result).toEqual({
      id: '2',
      title: '掃除',
      description: null,
      status: 'todo',
      priority: 'high',
      dueDate: '2026-04-15',
      createdAt: '2026-04-13T02:00:00.000Z',
      updatedAt: '2026-04-13T02:00:00.000Z'
    });
  });

  it('returns a mapped todo from findById', async () => {
    const db = createDbMock([
      {
        id: '3',
        title: '洗濯',
        description: null,
        status: 'doing',
        priority: 'low',
        due_date: null,
        created_at: '2026-04-13T05:00:00.000Z',
        updated_at: '2026-04-13T05:00:00.000Z'
      } satisfies TodoRow
    ]);
    const repository = new TodoRepository(db);

    const result = await repository.findById('3');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      ['3']
    );
    expect(result).toEqual({
      id: '3',
      title: '洗濯',
      description: null,
      status: 'doing',
      priority: 'low',
      dueDate: null,
      createdAt: '2026-04-13T05:00:00.000Z',
      updatedAt: '2026-04-13T05:00:00.000Z'
    });
  });

  it('returns null from findById when the todo does not exist', async () => {
    const db = createDbMock([]);
    const repository = new TodoRepository(db);

    const result = await repository.findById('999');

    expect(result).toBeNull();
  });

  it('updates and returns a todo', async () => {
    const db = createDbMock([
      {
        id: '4',
        title: '掃除',
        description: '部屋',
        status: 'done',
        priority: 'high',
        due_date: '2026-04-18',
        created_at: '2026-04-13T06:00:00.000Z',
        updated_at: '2026-04-13T07:00:00.000Z'
      } satisfies TodoRow
    ]);
    const repository = new TodoRepository(db);

    const result = await repository.update('4', {
      title: '掃除',
      description: '部屋',
      status: 'done',
      priority: 'high',
      dueDate: '2026-04-18'
    });

    expect(db.query).toHaveBeenCalledTimes(1);
    const [sqlText, params] = vi.mocked(db.query).mock.calls[0];
    expect(sqlText).toContain(
      'SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = NOW()'
    );
    expect(params).toEqual(['掃除', '部屋', 'done', 'high', '2026-04-18', '4']);
    expect(result).toEqual({
      id: '4',
      title: '掃除',
      description: '部屋',
      status: 'done',
      priority: 'high',
      dueDate: '2026-04-18',
      createdAt: '2026-04-13T06:00:00.000Z',
      updatedAt: '2026-04-13T07:00:00.000Z'
    });
  });

  it('returns null from update when the todo does not exist', async () => {
    const db = createDbMock([]);
    const repository = new TodoRepository(db);

    const result = await repository.update('999', {
      title: '掃除',
      description: null,
      status: 'todo',
      priority: 'medium',
      dueDate: null
    });

    expect(result).toBeNull();
  });

  it('deletes a todo and returns true when it exists', async () => {
    const db = createDbMock([{ id: '5' }]);
    const repository = new TodoRepository(db);

    const result = await repository.delete('5');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM todos WHERE id = $1 RETURNING id'),
      ['5']
    );
    expect(result).toBe(true);
  });

  it('returns false from delete when the todo does not exist', async () => {
    const db = createDbMock([]);
    const repository = new TodoRepository(db);

    const result = await repository.delete('999');

    expect(result).toBe(false);
  });
});
