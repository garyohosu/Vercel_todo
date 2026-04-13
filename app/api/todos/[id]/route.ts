import { getDb } from '@/lib/db';
import { TodoRepository } from '@/lib/todo-repository';
import { validateUpdateTodoInput } from '@/lib/todo-validation';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function createRepository() {
  return new TodoRepository(getDb());
}

async function getId(context: RouteContext): Promise<string> {
  const { id } = await context.params;
  return id;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const todo = await createRepository().findById(await getId(context));

    if (!todo) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json(todo, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const payload = await request.json();
    const validation = validateUpdateTodoInput(payload);

    if (!validation.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fieldErrors: validation.fieldErrors
        },
        { status: 400 }
      );
    }

    const todo = await createRepository().update(await getId(context), validation.data);

    if (!todo) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json(todo, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const deleted = await createRepository().delete(await getId(context));

    if (!deleted) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return new Response(null, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
