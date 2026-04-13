import { getDb } from '@/lib/db';
import { TodoRepository } from '@/lib/todo-repository';
import { validateCreateTodoInput } from '@/lib/todo-validation';

function createRepository() {
  return new TodoRepository(getDb());
}

export async function GET() {
  try {
    const todos = await createRepository().findAll();
    return Response.json(todos, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = validateCreateTodoInput(payload);

    if (!validation.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fieldErrors: validation.fieldErrors
        },
        { status: 400 }
      );
    }

    const todo = await createRepository().create(validation.data);

    return Response.json(todo, { status: 201 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
