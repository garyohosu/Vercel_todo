import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TodoApp } from '@/components/todo-app';
import type { Todo } from '@/types/todo';

// Dates relative to vi.setSystemTime('2026-04-13T00:00:00.000Z')
const YESTERDAY = '2026-04-12';
const TODAY_DATE = '2026-04-13';
const TOMORROW = '2026-04-14';

function makeTodo(overrides: Partial<Todo> & { id: string }): Todo {
  return {
    title: 'テストタスク',
    description: null,
    status: 'todo',
    priority: 'medium',
    dueDate: null,
    createdAt: '2026-04-13T00:00:00.000Z',
    updatedAt: '2026-04-13T00:00:00.000Z',
    ...overrides
  };
}

function stubFetchWithTodos(todos: Todo[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => todos
    })
  );
}

describe('TodoApp - filter and search (TC-06 to TC-09)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-04-13T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // TC-06: 絞り込み表示
  // ---------------------------------------------------------------------------

  it('TC-06-1: すべて選択時に全件表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: 'タスクA', status: 'todo' }),
      makeTodo({ id: '2', title: 'タスクB', status: 'done' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    expect(screen.getByText('タスクA')).toBeInTheDocument();
    expect(screen.getByText('タスクB')).toBeInTheDocument();
  });

  it('TC-06-2: 未着手フィルター時は status=todo のみ表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: 'タスクA', status: 'todo' }),
      makeTodo({ id: '2', title: 'タスクB', status: 'doing' }),
      makeTodo({ id: '3', title: 'タスクC', status: 'done' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '未着手');

    expect(screen.getByText('タスクA')).toBeInTheDocument();
    expect(screen.queryByText('タスクB')).not.toBeInTheDocument();
    expect(screen.queryByText('タスクC')).not.toBeInTheDocument();
  });

  it('TC-06-3: 進行中フィルター時は status=doing のみ表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: 'タスクA', status: 'todo' }),
      makeTodo({ id: '2', title: 'タスクB', status: 'doing' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '進行中');

    expect(screen.queryByText('タスクA')).not.toBeInTheDocument();
    expect(screen.getByText('タスクB')).toBeInTheDocument();
  });

  it('TC-06-4: 完了フィルター時は status=done のみ表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: 'タスクA', status: 'todo' }),
      makeTodo({ id: '2', title: 'タスクB', status: 'done' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '完了');

    expect(screen.queryByText('タスクA')).not.toBeInTheDocument();
    expect(screen.getByText('タスクB')).toBeInTheDocument();
  });

  it('TC-06-5: 期限切れフィルター時は due_date<今日 かつ 未完了のみ表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: '期限切れタスク', status: 'todo', dueDate: YESTERDAY }),
      makeTodo({ id: '2', title: '通常タスク', status: 'todo', dueDate: TOMORROW })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('期限切れタスク');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '期限切れ');

    expect(screen.getByText('期限切れタスク')).toBeInTheDocument();
    expect(screen.queryByText('通常タスク')).not.toBeInTheDocument();
  });

  it('TC-06-6: 今日までフィルター時は due_date<=今日 かつ 未完了のみ表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: '今日締切', status: 'todo', dueDate: TODAY_DATE }),
      makeTodo({ id: '2', title: '明日締切', status: 'todo', dueDate: TOMORROW })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('今日締切');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '今日まで');

    expect(screen.getByText('今日締切')).toBeInTheDocument();
    expect(screen.queryByText('明日締切')).not.toBeInTheDocument();
  });

  it('TC-06-7: 高優先度フィルター時は priority=high のみ表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: '高優先', priority: 'high' }),
      makeTodo({ id: '2', title: '中優先', priority: 'medium' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('高優先');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '高優先度');

    expect(screen.getByText('高優先')).toBeInTheDocument();
    expect(screen.queryByText('中優先')).not.toBeInTheDocument();
  });

  it('TC-06-8: フィルター結果が0件のとき空メッセージが表示される', async () => {
    stubFetchWithTodos([makeTodo({ id: '1', title: 'タスクA', status: 'done' })]);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '未着手');

    expect(screen.getByText('タスクがありません。追加してください')).toBeInTheDocument();
  });

  it('TC-06-9: 期限切れフィルターは done タスクを除外する', async () => {
    stubFetchWithTodos([
      makeTodo({ id: '1', title: '完了済み期限切れ', status: 'done', dueDate: YESTERDAY })
    ]);

    render(<TodoApp />);
    await screen.findByText('完了済み期限切れ');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '期限切れ');

    expect(screen.getByText('タスクがありません。追加してください')).toBeInTheDocument();
  });

  it('TC-06-10: 今日までフィルターは dueDate 未設定タスクを除外する', async () => {
    stubFetchWithTodos([
      makeTodo({ id: '1', title: '締切なし', status: 'todo', dueDate: null })
    ]);

    render(<TodoApp />);
    await screen.findByText('締切なし');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '今日まで');

    expect(screen.getByText('タスクがありません。追加してください')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // TC-07: 検索
  // ---------------------------------------------------------------------------

  it('TC-07-1: タイトルの部分一致で絞り込まれる', async () => {
    const todos = [
      makeTodo({ id: '1', title: '買い物' }),
      makeTodo({ id: '2', title: '掃除' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('買い物');

    await userEvent.type(screen.getByLabelText('キーワード検索'), '買い');

    expect(screen.getByText('買い物')).toBeInTheDocument();
    expect(screen.queryByText('掃除')).not.toBeInTheDocument();
  });

  it('TC-07-2: 説明文の部分一致で絞り込まれる', async () => {
    const todos = [
      makeTodo({ id: '1', title: 'タスクA', description: '説明テキスト' }),
      makeTodo({ id: '2', title: 'タスクB', description: null })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    await userEvent.type(screen.getByLabelText('キーワード検索'), '説明テキスト');

    expect(screen.getByText('タスクA')).toBeInTheDocument();
    expect(screen.queryByText('タスクB')).not.toBeInTheDocument();
  });

  it('TC-07-3: 一致しない場合は空メッセージが表示される', async () => {
    stubFetchWithTodos([makeTodo({ id: '1', title: '買い物' })]);

    render(<TodoApp />);
    await screen.findByText('買い物');

    await userEvent.type(screen.getByLabelText('キーワード検索'), 'zzz');

    await waitFor(() => {
      expect(screen.getByText('タスクがありません。追加してください')).toBeInTheDocument();
    });
  });

  it('TC-07-4: 検索ボックスが空のとき全件表示される', async () => {
    const todos = [
      makeTodo({ id: '1', title: 'タスクA' }),
      makeTodo({ id: '2', title: 'タスクB' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    expect(screen.getByText('タスクA')).toBeInTheDocument();
    expect(screen.getByText('タスクB')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // TC-08: 絞り込みと検索の組み合わせ
  // ---------------------------------------------------------------------------

  it('TC-08-1: フィルターと検索を組み合わせて絞り込める', async () => {
    const todos = [
      makeTodo({ id: '1', title: '買い物', status: 'todo' }),
      makeTodo({ id: '2', title: '掃除', status: 'todo' }),
      makeTodo({ id: '3', title: '買い物(完了)', status: 'done' })
    ];
    stubFetchWithTodos(todos);

    render(<TodoApp />);
    await screen.findByText('買い物');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '未着手');
    await userEvent.type(screen.getByLabelText('キーワード検索'), '買い');

    expect(screen.getByText('買い物')).toBeInTheDocument();
    expect(screen.queryByText('掃除')).not.toBeInTheDocument();
    expect(screen.queryByText('買い物(完了)')).not.toBeInTheDocument();
  });

  it('TC-08-2: フィルター・検索変更時に追加 API 呼び出しが発生しない', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [makeTodo({ id: '1', title: 'タスクA' })]
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoApp />);
    await screen.findByText('タスクA');

    await userEvent.selectOptions(screen.getByLabelText('絞り込み'), '完了');
    await userEvent.type(screen.getByLabelText('キーワード検索'), 'zzz');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // TC-09: 期限切れバッジ
  // ---------------------------------------------------------------------------

  it('TC-09-1: status=todo かつ due_date<今日 のとき「⚠ 期限切れ」バッジを表示する', async () => {
    stubFetchWithTodos([
      makeTodo({ id: '1', title: 'テスト', status: 'todo', dueDate: YESTERDAY })
    ]);

    render(<TodoApp />);
    await screen.findByText('テスト');

    expect(screen.getByText('⚠ 期限切れ')).toBeInTheDocument();
  });

  it('TC-09-2: status=doing かつ due_date<今日 のとき「⚠ 期限切れ」バッジを表示する', async () => {
    stubFetchWithTodos([
      makeTodo({ id: '1', title: 'テスト', status: 'doing', dueDate: YESTERDAY })
    ]);

    render(<TodoApp />);
    await screen.findByText('テスト');

    expect(screen.getByText('⚠ 期限切れ')).toBeInTheDocument();
  });

  it('TC-09-3: status=done かつ due_date<今日 のとき「⚠ 期限切れ」バッジを表示しない', async () => {
    stubFetchWithTodos([
      makeTodo({ id: '1', title: 'テスト', status: 'done', dueDate: YESTERDAY })
    ]);

    render(<TodoApp />);
    await screen.findByText('テスト');

    expect(screen.queryByText('⚠ 期限切れ')).not.toBeInTheDocument();
  });

  it('TC-09-4: due_date=今日 のとき「⚠ 期限切れ」バッジを表示しない', async () => {
    stubFetchWithTodos([
      makeTodo({ id: '1', title: 'テスト', status: 'todo', dueDate: TODAY_DATE })
    ]);

    render(<TodoApp />);
    await screen.findByText('テスト');

    expect(screen.queryByText('⚠ 期限切れ')).not.toBeInTheDocument();
  });

  it('TC-09-5: dueDate なし のとき「⚠ 期限切れ」バッジを表示しない', async () => {
    stubFetchWithTodos([
      makeTodo({ id: '1', title: 'テスト', status: 'todo', dueDate: null })
    ]);

    render(<TodoApp />);
    await screen.findByText('テスト');

    expect(screen.queryByText('⚠ 期限切れ')).not.toBeInTheDocument();
  });
});
