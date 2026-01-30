# Cloudflare Pages デプロイガイド

## 🚀 クイックスタート

### ステップ1: Cloudflare Pagesにアクセス
https://pages.cloudflare.com/

### ステップ2: プロジェクトを作成
1. 「Create a project」をクリック
2. 「Connect to Git」を選択
3. GitHubアカウントを接続
4. このリポジトリを選択

### ステップ3: ビルド設定

```
Project name: rewards-keyword-webapp（任意の名前）
Production branch: main
```

**ビルド設定:**
```
Framework preset: None
Build command: （空欄のまま）
Build output directory: src
Root directory: /
```

### ステップ4: デプロイ
「Save and Deploy」をクリック

## ✅ デプロイ完了

数秒後、以下のようなURLでアクセス可能になります:
```
https://rewards-keyword-webapp.pages.dev
```

## 🔄 更新方法

GitHubにプッシュするだけで自動的に再デプロイされます:

```bash
git add .
git commit -m "Update keywords app"
git push
```

## 🌐 カスタムドメイン設定（オプション）

1. Cloudflare Pagesダッシュボードを開く
2. プロジェクトを選択
3. 「Custom domains」タブを開く
4. 「Set up a custom domain」をクリック
5. ドメイン名を入力して設定

## 📝 注意事項

- **ビルドコマンドは不要**: このプロジェクトは静的ファイルのみなので、ビルドプロセスは不要です
- **Node.js不要**: package.jsonがないため、Node.jsのインストールも不要です
- **即座にデプロイ**: `src/`ディレクトリがそのままデプロイされます

## 🔧 トラブルシューティング

### デプロイが失敗する場合

1. **ビルド出力ディレクトリを確認**
   - `src` と入力されているか確認

2. **ビルドコマンドが空欄か確認**
   - 何も入力しないでください

3. **ブランチ名を確認**
   - `main` または `master` が正しく選択されているか

### アプリが動作しない場合

1. **ブラウザのコンソールを確認**
   - F12を押して、エラーメッセージを確認

2. **APIエンドポイントを確認**
   - `src/main.js` の1-2行目のURLが正しいか確認

3. **CORS設定を確認**
   - Cloudflare WorkerのCORS設定が有効か確認
