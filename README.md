# Microsoft Rewards Keywords Web App

Microsoft Rewardsのキーワード検索を支援するWebアプリケーションです。

## 🚀 機能

- ブログから自動的にキーワードを取得
- カテゴリ別にキーワードを整理
- カスタムキーワードの追加・削除
- Cloudflare Workers KVへの保存
- ダークモード対応
- クリップボードへのコピー機能

## 📁 プロジェクト構造

```
rewards_keyword_webapp/
├── src/                    # Webアプリケーション（デプロイ対象）
│   ├── index.html         # メインHTMLファイル
│   ├── main.js            # JavaScriptロジック
│   └── style.css          # スタイルシート
├── worker/                # Cloudflare Worker（バックエンド）
│   ├── src/
│   │   └── index.js      # Worker API
│   └── wrangler.toml     # Worker設定
├── DEPLOYMENT.md          # デプロイガイド
└── README.md
```

## 🌐 ローカルでの実行

### 方法1: ブラウザで直接開く

```bash
# srcディレクトリのindex.htmlをブラウザで開く
start src/index.html
```

### 方法2: シンプルなHTTPサーバーを使用

Pythonがインストールされている場合:

```bash
cd src
python -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

または、Node.jsの`http-server`を使用:

```bash
npx http-server src -p 8000
```

## ☁️ Cloudflare Pagesへのデプロイ

### デプロイ設定

Cloudflare Pagesのダッシュボードで以下の設定を使用してください:

| 設定項目 | 値 |
|---------|-----|
| **フレームワークプリセット** | なし |
| **ビルドコマンド** | （空欄） |
| **ビルド出力ディレクトリ** | `src` |
| **ルートディレクトリ** | `/` |

### デプロイ手順

1. **Cloudflare Pagesにログイン**
   - https://pages.cloudflare.com/ にアクセス

2. **新しいプロジェクトを作成**
   - 「Create a project」をクリック
   - GitHubリポジトリを接続

3. **ビルド設定を入力**
   ```
   Build command: （空欄のまま）
   Build output directory: src
   ```

4. **デプロイ実行**
   - 「Save and Deploy」をクリック
   - 数秒でデプロイ完了！

### カスタムドメインの設定（オプション）

デプロイ後、Cloudflare Pagesのダッシュボードから独自ドメインを設定できます。

## 🔗 バックエンドAPI

このアプリは以下のCloudflare Worker APIを使用しています:

- **GET API**: `https://rewards-keyword-worker.sumitomo0210.workers.dev/get`
  - ユーザーが保存したキーワードを取得

- **POST API**: `https://rewards-keyword-worker.sumitomo0210.workers.dev/save`
  - ユーザーのキーワードをCloudflare KVに保存

### APIエンドポイントの変更

`src/main.js` の1-2行目で変更できます:

```javascript
const WORKER_GET_URL = 'https://your-worker.workers.dev/get';
const WORKER_SAVE_URL = 'https://your-worker.workers.dev/save';
```

## 📝 技術スタック

- **フロントエンド**: HTML, CSS, Vanilla JavaScript
- **バックエンド**: Cloudflare Workers + KV
- **デプロイ**: Cloudflare Pages
- **依存関係**: なし（Pure JavaScript）

## 🎨 機能詳細

### キーワード管理

- **自動取得**: ブログからキーワードを自動的にスクレイピング
- **カスタム追加**: 独自のキーワードを追加可能
- **クラウド同期**: Cloudflare Workers KVに保存
- **削除機能**: ユーザーが追加したキーワードのみ削除可能

### UI/UX

- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **ダークモード**: 目に優しい暗いテーマ（設定を保存）
- **アコーディオン**: カテゴリごとに折りたたみ可能
- **ワンクリックコピー**: キーワードをクリックでクリップボードにコピー
- **トースト通知**: 操作のフィードバックを表示

## 🔧 カスタマイズ

### スタイルの変更

`src/style.css` を編集してデザインをカスタマイズできます:

- カラースキーム
- フォント
- レイアウト
- ダークモードの色

### 機能の追加

`src/main.js` を編集して機能を追加できます:

- 新しいカテゴリの追加
- キーワードのフィルタリング
- エクスポート機能
- 検索機能

## 📱 対応ブラウザ

- Chrome / Edge (推奨)
- Firefox
- Safari
- モダンブラウザ全般（ES6対応）

## 🔗 関連リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [キーワードソース](https://yoshizo.hatenablog.com/entry/microsoft-rewards-search-keyword-list/)

## 📄 ライセンス

MIT License

---

## 💡 ヒント

### デプロイが簡単！

このプロジェクトはビルドプロセスが不要なので:
- ✅ Node.jsのインストール不要
- ✅ npm installなどのコマンド不要
- ✅ `src/`フォルダをそのままデプロイ
- ✅ 数秒でデプロイ完了

### ローカル開発も簡単！

- HTMLファイルをブラウザで直接開くだけ
- コード変更後、ブラウザをリロードするだけ
- 複雑なビルドツール不要
