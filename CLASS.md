# クラス図（モジュール構成・依存関係）

Next.js App Router + Route Handler 構成のため、厳密なクラスは存在しない。  
本図では **ページ・API・ DB アクセス層・型定義** の責務と依存関係を `classDiagram` で表現する。

## クラス図

```mermaid
classDiagram
    direction TB

    class TodoPage {
        <<Page>>
        +render() JSX
        +fetchTodos() void
    }

    class EditPage {
        <<Page>>
        +render() JSX
        +fetchTodo(id) void
    }

    class TodoForm {
        <<Component>>
        +title String
        +description String
        +dueDate String
        +priority Priority
        +status Status
        +onSubmit() void
        +validate() Boolean
    }

    class TodoList {
        <<Component>>
        +todos Todo[]
        +filter FilterType
        +searchQuery String
        +onToggleStatus(id) void
        +onDelete(id) void
        +applyFilter() void
        +applySearch() void
    }

    class TodoItem {
        <<Component>>
        +todo Todo
        +onToggleStatus() void
        +onEdit() void
        +onDelete() void
        +isOverdue() Boolean
    }

    class TodosApiHandler {
        <<RouteHandler>>
        +GET(req) Response
        +POST(req) Response
    }

    class TodoByIdApiHandler {
        <<RouteHandler>>
        +GET(req, id) Response
        +PUT(req, id) Response
        +DELETE(req, id) Response
    }

    class TodoRepository {
        <<Repository>>
        +findAll() Todo[]
        +findById(id) Todo nullable
        +create(data) Todo
        +update(id, data) Todo
        +delete(id) void
    }

    class NeonDB {
        +query(sql, params) QueryResult
    }

    class TodoRow {
        +id String
        +title String
        +description String nullable
        +status String
        +priority String
        +due_date String nullable
        +created_at String
        +updated_at String
    }

    class Todo {
        +id String
        +title String
        +description String nullable
        +status Status
        +priority Priority
        +dueDate String nullable
        +createdAt String
        +updatedAt String
    }

    class CreateTodoInput {
        +title String
        +description String optional
        +priority Priority
        +dueDate String optional
    }

    class UpdateTodoInput {
        +title String
        +description String optional
        +status Status
        +priority Priority
        +dueDate String optional
    }

    class Status {
        <<Enumeration>>
        todo
        doing
        done
    }

    class Priority {
        <<Enumeration>>
        low
        medium
        high
    }

    class FilterType {
        <<Enumeration>>
        all
        todo
        doing
        done
        overdue
        today
        highPriority
    }

    %% ページとコンポーネントの依存
    TodoPage --> TodoForm
    TodoPage --> TodoList
    TodoList --> TodoItem
    EditPage --> TodoForm

    %% フロントエンドから API への依存（TodoPage が取得担当）
    TodoPage ..> TodosApiHandler : fetch
    EditPage ..> TodoByIdApiHandler : fetch

    %% API から Repository への依存
    TodosApiHandler --> TodoRepository
    TodoByIdApiHandler --> TodoRepository

    %% Repository から DB への依存
    TodoRepository --> NeonDB

    %% DB Row からドメイン型へのマッピング（camelCase / snake_case 変換境界）
    TodoRepository ..> TodoRow : maps
    TodoRepository ..> Todo : returns
    TodoRepository ..> CreateTodoInput : accepts
    TodoRepository ..> UpdateTodoInput : accepts

    %% 型の利用
    Todo --> Status
    Todo --> Priority
    TodoList --> FilterType
```

## 責務説明

### ページ（app/）

| コンポーネント | ファイルパス例 | 責務 |
|----------------|---------------|------|
| TodoPage | `app/page.tsx` | 一覧画面。全タスク取得・フォーム・一覧コンポーネントを組み合わせる |
| EditPage | `app/todos/[id]/edit/page.tsx` | 編集画面。タスク取得・編集フォームを表示する |

### コンポーネント（components/）

| コンポーネント | ファイルパス例 | 責務 |
|----------------|---------------|------|
| TodoForm | `components/TodoForm.tsx` | 追加・編集フォーム。バリデーションを担う |
| TodoList | `components/TodoList.tsx` | 絞り込み・検索・ソートを担う。TodoItem を一覧表示する |
| TodoItem | `components/TodoItem.tsx` | 各タスクの表示・完了切替・削除を担う |

### API Route Handler（app/api/）

| ハンドラー | ファイルパス例 | 責務 |
|------------|---------------|------|
| TodosApiHandler | `app/api/todos/route.ts` | GET（全件取得）・POST（新規作成） |
| TodoByIdApiHandler | `app/api/todos/[id]/route.ts` | GET（1件取得）・PUT（更新）・DELETE（削除）。PUT は有効な status 値を受け入れる（遷移制約は UI 側で管理） |

### データアクセス層（lib/）

| クラス | ファイルパス例 | 責務 |
|--------|---------------|------|
| TodoRepository | `lib/todo-repository.ts` | SQL を組み立てて Neon に問い合わせる。DB の snake_case（TodoRow）を camelCase（Todo）に変換する責務を持つ |
| NeonDB | `lib/db.ts` | `@neondatabase/serverless` のラッパー。接続プールを管理する |

### 型定義（types/）

| 型 | ファイルパス例 | 内容 |
|-----|---------------|------|
| Todo | `types/todo.ts` | DB レコードに対応するドメイン型（camelCase） |
| TodoRow | `types/todo.ts` | DB から取得したローレコード型（snake_case）。Repository 内部でのみ使用 |
| CreateTodoInput | `types/todo.ts` | 新規作成時の入力型 |
| UpdateTodoInput | `types/todo.ts` | 更新時の入力型 |
| Status | `types/todo.ts` | `todo \| doing \| done` |
| Priority | `types/todo.ts` | `low \| medium \| high` |
| FilterType | `types/todo.ts` | フロントエンドの絞り込み条件型 |

## 定数定義（暫定）

```typescript
// types/todo.ts
export const STATUS = {
  TODO: 'todo',
  DOING: 'doing',
  DONE: 'done',
} as const;

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];
export type Priority = typeof PRIORITY[keyof typeof PRIORITY];
```
