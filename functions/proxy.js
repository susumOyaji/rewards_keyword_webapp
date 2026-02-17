// functions/proxy.js

export async function onRequest(context) {
  // リクエストから 'url' クエリパラメータを取得
  const url = new URL(context.request.url).searchParams.get('url');

  if (!url) {
    return new Response('Missing "url" query parameter', { status: 400 });
  }

  try {
    // ターゲットURLに対してフェッチを実行
    const response = await fetch(url, {
      headers: {
        // 元のリクエストからユーザーエージェントを引き継ぐなど、必要に応じてヘッダーを調整
        'User-Agent': context.request.headers.get('User-Agent') || 'Cloudflare-Proxy-Worker',
      },
      // Cloudflareのキャッシュをバイパスしたい場合は 'no-cache' を指定
      // cache: 'no-cache', 
    });

    // レスポンスのヘッダーを新しく作成し、CORSを許可する
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*'); // すべてのオリジンからのアクセスを許可
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // オリジナルのレスポンスボディと新しいCORSヘッダーで新しいレスポンスを返す
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });

  } catch (error) {
    return new Response(`Error fetching the URL: ${error.message}`, { status: 500 });
  }
}
