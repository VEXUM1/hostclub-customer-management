# 顧客管理システム

AI搭載の顧客管理システムです。OpenAI GPT-4o-miniを使用して、顧客情報を自動解析し、接客に役立つインサイトを提供します。

## 主な機能

- **AI自動解析**: 自由形式の顧客情報をAIが自動的に構造化
- **音声入力対応**: マイクボタンで簡単に情報入力
- **顧客情報管理**: 登録、編集、削除、検索機能
- **データ永続化**: SQLiteデータベースで安全にデータ保存
- **レスポンシブデザイン**: スマートフォン・タブレット対応

## 必要な環境

- Node.js (v14以上推奨)
- npm または yarn
- OpenAI APIキー ([取得方法](https://platform.openai.com/api-keys))

## インストール

1. 依存パッケージをインストール

```bash
npm install
```

2. 環境変数ファイルを作成 (オプション)

```bash
cp .env.example .env
```

## 起動方法

### 本番環境

```bash
npm start
```

### 開発環境 (ファイル変更時に自動再起動)

```bash
npm run dev
```

サーバーが起動したら、ブラウザで以下のURLにアクセスしてください:

```
http://localhost:3000
```

## 使い方

### 1. APIキーの設定

1. [OpenAI Platform](https://platform.openai.com/api-keys)でAPIキーを取得
2. アプリの「APIキー」タブでAPIキーを入力
3. APIキーはブラウザのLocalStorageに保存されます(サーバーには送信されません)

### 2. 顧客情報の登録

1. 「情報入力」タブに移動
2. テキストエリアに顧客情報を自由形式で入力
   - 例: 「田中花子さん、28歳、看護師、シャンパンが好き、旅行が趣味」
3. または🎤ボタンで音声入力
4. 「AIで解析して登録」ボタンをクリック
5. AIが自動的に情報を構造化し、接客アドバイスを生成

### 3. 顧客情報の管理

1. 「顧客管理」タブで登録済み顧客を確認
2. 検索ボックスで顧客を検索
3. 編集ボタンで情報を更新
4. 削除ボタンで情報を削除

## プロジェクト構成

```
hostclub/
├── server/
│   ├── server.js          # Expressサーバー
│   ├── database.js        # データベース接続・操作
│   └── routes/
│       └── customers.js   # 顧客管理API
├── public/
│   ├── index.html         # フロントエンドHTML
│   └── js/
│       └── app.js         # フロントエンドJavaScript
├── customers.db           # SQLiteデータベース(自動生成)
├── package.json
├── .env.example
└── README.md
```

## API エンドポイント

### 顧客情報取得

```
GET /api/customers
```

### 顧客情報検索

```
GET /api/customers/search?q=検索キーワード
```

### 顧客情報追加

```
POST /api/customers
Content-Type: application/json

{
  "name": "顧客名",
  "data": {...},
  "aiInsights": "AIインサイト",
  "registeredAt": "2025-01-01 12:00:00"
}
```

### 顧客情報更新

```
PUT /api/customers/:id
Content-Type: application/json

{
  "name": "顧客名",
  "data": {...},
  "updatedAt": "2025-01-01 13:00:00"
}
```

### 顧客情報削除

```
DELETE /api/customers/:id
```

## セキュリティについて

- OpenAI APIキーはブラウザのLocalStorageに保存され、サーバーには送信されません
- データベースはサーバー上のSQLiteファイルに保存されます
- 本番環境で使用する場合は、適切なアクセス制御を実装してください

## トラブルシューティング

### ポート3000が既に使用されている

`.env`ファイルを作成し、別のポートを指定してください:

```
PORT=8080
```

### データベースファイルが作成されない

`server`ディレクトリの書き込み権限を確認してください。

### 音声入力が動作しない

- Chrome、Edge、またはSafariを使用してください
- HTTPSまたはlocalhostでアクセスしていることを確認してください

## ライセンス

MIT

## 開発者向け情報

### 使用技術

**バックエンド**
- Node.js
- Express
- better-sqlite3
- CORS

**フロントエンド**
- Vanilla JavaScript
- Fetch API
- Web Speech API
- LocalStorage API

**AI**
- OpenAI GPT-4o-mini

### 開発時の注意点

- `nodemon`を使用すると、ファイル変更時に自動でサーバーが再起動します
- データベーススキーマを変更した場合は、`customers.db`を削除してサーバーを再起動してください
- フロントエンドのJavaScriptはビルドプロセスがないため、直接編集可能です

## 今後の改善案

- [ ] ユーザー認証機能
- [ ] データのエクスポート/インポート機能
- [ ] 顧客タグ・カテゴリ機能
- [ ] 来店履歴管理
- [ ] グラフ・統計表示
- [ ] プッシュ通知機能
- [ ] モバイルアプリ版
