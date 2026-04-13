import type { DatabaseClient } from '@/lib/db';
import type {
  CreateTodoValues,
  Todo,
  TodoRow,
  UpdateTodoValues
} from '@/types/todo';

export class TodoRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findAll(): Promise<Todo[]> {
    const rows = await this.db.query<TodoRow>(
      `SELECT id, title, description, status, priority, due_date, created_at, updated_at
       FROM todos
       ORDER BY CASE WHEN status = 'done' THEN 1 ELSE 0 END,
                due_date ASC NULLS LAST,
                created_at DESC`,
      []
    );

    return rows.map(mapTodoRow);
  }

  async create(input: CreateTodoValues): Promise<Todo> {
    const rows = await this.db.query<TodoRow>(
      `INSERT INTO todos (title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, status, priority, due_date, created_at, updated_at`,
      [input.title, input.description, 'todo', input.priority, input.dueDate]
    );

    const row = rows[0];

    if (!row) {
      throw new Error('Failed to create todo');
    }

    return mapTodoRow(row);
  }

  async findById(id: string): Promise<Todo | null> {
    const rows = await this.db.query<TodoRow>(
      `SELECT id, title, description, status, priority, due_date, created_at, updated_at
       FROM todos
       WHERE id = $1`,
      [id]
    );

    const row = rows[0];
    return row ? mapTodoRow(row) : null;
  }

  async update(id: string, input: UpdateTodoValues): Promise<Todo | null> {
    const rows = await this.db.query<TodoRow>(
      `UPDATE todos
       SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, title, description, status, priority, due_date, created_at, updated_at`,
      [
        input.title,
        input.description,
        input.status,
        input.priority,
        input.dueDate,
        id
      ]
    );

    const row = rows[0];
    return row ? mapTodoRow(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      'DELETE FROM todos WHERE id = $1 RETURNING id',
      [id]
    );

    return rows.length > 0;
  }
}

export function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
