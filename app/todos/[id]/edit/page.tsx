import { TodoEditPage } from '@/components/todo-edit-page';

export default async function EditTodoPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TodoEditPage id={id} />;
}
