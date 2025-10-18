# デプロイメントガイド

LINE公式アカウントで使用するために、アプリを外部に公開する方法を説明します。

## 方法1: ngrok (開発・テスト用) 🚀 最も簡単

### 手順

1. **ngrokをダウンロード**
   - https://ngrok.com/download にアクセス
   - Windows版をダウンロードして解凍

2. **ngrokを実行**
   ```bash
   # 解凍したフォルダで実行
   ngrok http 3000
   ```

3. **表示されたURLをコピー**
   ```
   Forwarding: https://xxxx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:3000
   ```
   この `https://xxxx-xxx-xxx-xxx.ngrok-free.app` がLINEで使用できるURLです

4. **LINEリッチメニューに設定**
   - LINE公式アカウント管理画面
   - リッチメニュー設定
   - 上記URLを貼り付け

### 注意点

- ngrokを終了するとURLが使えなくなります
- 無料版は起動するたびにURLが変わります
- 固定URLが必要な場合は有料版($8/月)またはRenderを使用

---

## 方法2: Render (本番環境向け) 🌟 推奨

### 準備

1. **GitHubリポジトリを作成**

   プロジェクトフォルダで:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/hostclub.git
   git push -u origin main
   ```

2. **Renderでデプロイ**

   - https://render.com でアカウント作成
   - "New +" → "Web Service"
   - GitHubリポジトリを選択
   - 設定:
     - Name: hostclub
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plan: Free
   - "Create Web Service"

3. **URLを取得**

   デプロイ完了後、以下のようなURLが発行されます:
   ```
   https://hostclub-xxxx.onrender.com
   ```

### Renderのメリット

- 完全無料
- 固定URL (変わらない)
- HTTPS自動設定
- GitHubプッシュで自動デプロイ

### デメリット

- 15分間アクセスがないとスリープ
  → 初回アクセス時に10-30秒かかる
- 解決策: UptimeRobotなどで5分ごとにpingする

---

## 方法3: Railway

### 手順

1. https://railway.app でアカウント作成
2. "New Project" → "Deploy from GitHub repo"
3. リポジトリを選択
4. 自動でデプロイ開始

### 特徴

- 月500時間まで無料
- スリープしない
- 高速デプロイ

---

## 方法4: VPS (本格運用向け)

### ConoHa VPS の場合

1. サーバーを契約 (月額700円〜)
2. SSH接続
3. Node.jsをインストール
4. ファイルをアップロード
5. PM2でプロセス管理

```bash
# サーバー上で
npm install -g pm2
pm2 start server/server.js --name hostclub
pm2 startup
pm2 save
```

---

## おすすめの選択

### 開発・テスト段階
→ **ngrok** (すぐ試せる)

### 本番環境 (無料)
→ **Render** (固定URL、自動デプロイ)

### 本番環境 (有料・高速)
→ **Railway** または **VPS**

---

## セキュリティ設定 (本番環境用)

### 環境変数の設定

本番環境では、以下の環境変数を設定してください:

```
NODE_ENV=production
PORT=3000
```

### CORS設定の調整

本番環境では、特定のドメインのみを許可するようにCORS設定を調整してください。

`server/server.js`:
```javascript
// 開発環境
if (process.env.NODE_ENV === 'development') {
    app.use(cors());
} else {
    // 本番環境: LINEからのアクセスのみ許可
    app.use(cors({
        origin: ['https://line.me', 'https://liff.line.me']
    }));
}
```

---

## トラブルシューティング

### ngrokでアクセスできない

- ローカルサーバー(npm start)が起動しているか確認
- ファイアウォールでポート3000がブロックされていないか確認

### Renderでデプロイが失敗する

- package.jsonのnode versionを指定
  ```json
  "engines": {
    "node": ">=14.0.0"
  }
  ```

### データベースがリセットされる (Render)

- Renderの無料版はファイルシステムが一時的
- 永続化が必要な場合はPostgreSQLなどの外部DBを使用
- または有料プランにアップグレード
