# シーケンス図

## API 契約（確定版）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/todos | 一覧取得（v1 は全件取得のみ） |
| GET | /api/todos/:id | 1件取得（編集画面の初期表示用） |
| POST | /api/todos | 新規作成。body: `{ title, description, dueDate, priority, status }` |
| PUT | /api/todos/:id | 更新。body: `{ title, description, dueDate, priority, status }` |
| DELETE | /api/todos/:id | 削除 |

> **注記**: フィールド名は JSON は camelCase（`dueDate`）、DB カラムは snake_case（`due_date`）で使い分ける。  
> v1 の絞り込み・検索はフロントエンド側で行う（GET /api/todos は全件取得のみ）。

---

## 対象フロー

| No. | フロー名 | 対応UC |
|-----|----------|--------|
| SEQ-01 | タスク一覧表示 | UC-01 |
| SEQ-02 | タスク追加（正常系） | UC-02 |
| SEQ-03 | タスク追加（バリデーション） | UC-02 |
| SEQ-04 | タスク状態変更（完了切替） | UC-03 |
| SEQ-05 | タスク編集 | UC-04 |
| SEQ-06 | タスク削除 | UC-05 |
| SEQ-07 | 絞り込み・検索 | UC-06, UC-07 |

---

## SEQ-01: タスク一覧表示

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant API as Route Handler
    participant DB as Neon DB

    User->>Browser: アプリにアクセス
    Browser->>API: GET /api/todos
    API->>DB: SELECT * FROM todos ORDER BY CASE status WHEN done THEN 1 ELSE 0 END, due_date ASC NULLS LAST, created_at DESC
    DB-->>API: タスク一覧
    API-->>Browser: 200 OK - JSON
    Browser-->>User: 未完了優先・締切近い順でタスク一覧表示
```

---

## SEQ-02: タスク追加（正常系）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant API as Route Handler
    participant DB as Neon DB

    User->>Browser: フォームに入力して送信
    Browser->>Browser: フロントエンドバリデーション通過
    Browser->>API: POST /api/todos { title, description, dueDate, priority, status }
    API->>API: サーバーサイドバリデーション通過
    API->>DB: INSERT INTO todos (title, description, due_date, priority, status)
    DB-->>API: 作成されたレコード
    API-->>Browser: 201 Created - JSON
    Browser-->>User: タスク一覧を更新して表示
```

---

## SEQ-03: タスク追加（バリデーション）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant API as Route Handler

    User->>Browser: フォームに値を入力して送信

    alt フロントエンドバリデーション失敗
        Browser->>Browser: バリデーションエラー検出
        Browser-->>User: エラーメッセージ表示（API を呼ばない）
    else フロントエンドバリデーション通過
        Browser->>API: POST /api/todos
        alt サーバーサイドバリデーション失敗
            API-->>Browser: 400 Bad Request
            Browser-->>User: エラーメッセージ表示
        else バリデーション通過
            API-->>Browser: 201 Created
            Browser-->>User: タスク一覧を更新
        end
    end
```

---

## SEQ-04: タスク状態変更（完了切替）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant API as Route Handler
    participant DB as Neon DB

    User->>Browser: 完了切替ボタンをクリック
    Browser->>Browser: 現在の status を確認
    Note over Browser: todo/doing → done, done → todo（UI 側で次の status を決定）
    Browser->>API: PUT /api/todos/:id { status: next_status }
    API->>API: status 値が有効な enum か検証
    Note over API: PUT は有効な status 値を受け入れる（遷移制約は UI 側で管理）
    API->>DB: UPDATE todos SET status, updated_at WHERE id
    DB-->>API: 更新されたレコード
    API-->>Browser: 200 OK
    Browser-->>User: 一覧の該当タスクを更新表示
```

---

## SEQ-05: タスク編集

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant API as Route Handler
    participant DB as Neon DB

    User->>Browser: 一覧の編集ボタンをクリック
    Browser->>Browser: /todos/:id/edit に遷移
    Browser->>API: GET /api/todos/:id
    API->>DB: SELECT * FROM todos WHERE id
    DB-->>API: タスクデータ
    API-->>Browser: 200 OK - JSON
    Browser-->>User: 編集フォームに既存データを表示

    User->>Browser: 内容を修正して保存ボタンをクリック
    Browser->>Browser: フロントエンドバリデーション通過
    Browser->>API: PUT /api/todos/:id { title, description, dueDate, priority, status }
    API->>API: サーバーサイドバリデーション通過
    API->>DB: UPDATE todos SET title, description, due_date, priority, status, updated_at WHERE id
    DB-->>API: 更新されたレコード
    API-->>Browser: 200 OK
    Browser->>Browser: / にリダイレクト
    Browser-->>User: 更新されたタスク一覧を表示
```

---

## SEQ-06: タスク削除

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant API as Route Handler
    participant DB as Neon DB

    User->>Browser: 一覧の削除ボタンをクリック
    Browser-->>User: 確認ダイアログを表示

    alt ユーザーが削除を確認
        User->>Browser: 削除を確認
        Browser->>API: DELETE /api/todos/:id
        API->>DB: DELETE FROM todos WHERE id
        DB-->>API: 削除完了
        API-->>Browser: 200 OK
        Browser-->>User: 一覧からタスクを除去して再表示
    else ユーザーがキャンセル
        User->>Browser: キャンセル
        Browser-->>User: ダイアログを閉じる
    end
```

---

## SEQ-07: 絞り込み・検索

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ

    Note over Browser: 全タスクはすでにフェッチ済み（SEQ-01 参照）
    Note over Browser: 日付比較はブラウザのローカルタイムゾーンで行う

    User->>Browser: 絞り込みボタンをクリック
    Browser->>Browser: フロントエンドでフィルタリング
    Browser-->>User: 絞り込み結果を表示

    User->>Browser: 検索ボックスに文字を入力
    Browser->>Browser: タスク名・説明を部分一致でフィルタリング
    Browser-->>User: 検索結果をリアルタイムで表示

    Note over Browser: 絞り込みと検索は AND 条件で組み合わせ可能
```
