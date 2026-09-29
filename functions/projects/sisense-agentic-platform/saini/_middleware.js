// Password gate for the SAINI prototype served from
// public/projects/sisense-agentic-platform/saini/ (a static Vite build).
//
// Cloudflare Pages runs this only for requests under this folder's path, so the
// rest of the site stays fully static. The password lives in the Pages project
// settings as the environment variable PROTOTYPE_PASSWORD (Settings ->
// Variables and Secrets, type "Secret"). Without it the gate stays closed.
//
// After a correct password the browser gets an HttpOnly cookie holding an HMAC
// of the password, so changing the password logs everyone out.

const BASE = '/projects/sisense-agentic-platform/saini/';
const CASE_STUDY = '/projects/sisense-agentic-platform/';
const COOKIE = 'saini_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function token(password) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('saini-prototype-v1'));
    return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

function readCookie(request, name) {
    const header = request.headers.get('Cookie') || '';
    for (const part of header.split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === name) return v.join('=');
    }
    return null;
}

function page({ error = false, status = 200, message } = {}) {
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Sisense Agentic Platform: Prototype - Victor Kaidan</title>
<style>
  :root { --text: #171717; --bg: #f2f1ec; --muted: #eae9e1; --soft: #6b6b66; --error: #b42318; }
  @media (prefers-color-scheme: dark) {
    :root { --text: #f2f1ec; --bg: #171717; --muted: #242424; --soft: #a3a39c; --error: #f97066; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         background: var(--bg); color: var(--text); padding: 24px;
         font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width: 100%; max-width: 380px; }
  .brand { font-family: Newsreader, Georgia, "Times New Roman", serif; font-size: 15px; margin: 0 0 40px; }
  .brand a { color: inherit; text-decoration: none; }
  h1 { font-family: Newsreader, Georgia, "Times New Roman", serif; font-weight: 500; font-size: 30px;
       line-height: 1.2; margin: 0 0 12px; }
  p { margin: 0 0 24px; line-height: 1.5; color: var(--soft); font-size: 15px; }
  label { display: block; font-size: 14px; margin-bottom: 8px; }
  input { width: 100%; font: inherit; font-size: 16px; padding: 12px 16px; color: var(--text);
          background: transparent; border: 1px solid var(--text); border-radius: 999px; outline: none; }
  input:focus-visible { box-shadow: 0 0 0 3px var(--muted); }
  button { margin-top: 16px; width: 100%; font: inherit; font-size: 16px; font-weight: 500; padding: 12px 16px;
           color: var(--bg); background: var(--text); border: 1px solid var(--text); border-radius: 999px; cursor: pointer; }
  button:hover { opacity: .88; }
  .error { color: var(--error); font-size: 14px; margin: 12px 0 0; }
  .foot { margin-top: 32px; font-size: 14px; }
  .foot a { color: inherit; }
</style>
</head>
<body>
<main>
  <p class="brand"><a href="/">Victor Kaidan</a></p>
  <h1>Sisense Agentic Platform: Prototype</h1>
  ${
      message
          ? `<p>${message}</p>`
          : `<p>This prototype is shared by request. Enter the access password to continue.</p>
  <form method="post" action="${BASE}">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
    ${error ? '<p class="error" role="alert">Incorrect password. Please try again.</p>' : ''}
    <button type="submit">Open the prototype</button>
  </form>`
  }
  <p class="foot">No password? <a href="mailto:victor.kaidan@gmail.com?subject=Access%20to%20the%20SAINI%20prototype">Ask me for access</a> or <a href="${CASE_STUDY}">read the case study</a>.</p>
</main>
</body>
</html>`;
    return new Response(html, {
        status,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex, nofollow'
        }
    });
}

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // Folder URL without the trailing slash: relative asset paths in the Vite
    // build need the slash, so normalise first.
    if (url.pathname === BASE.slice(0, -1)) {
        return Response.redirect(url.origin + BASE + url.search, 308);
    }

    const password = env.PROTOTYPE_PASSWORD;
    if (!password) {
        return page({ status: 503, message: 'The prototype is temporarily unavailable.' });
    }
    const expected = await token(password);

    if (request.method === 'POST') {
        const form = await request.formData().catch(() => null);
        const given = form ? String(form.get('password') || '') : '';
        if (given && safeEqual(await token(given), expected)) {
            return new Response(null, {
                status: 303,
                headers: {
                    Location: BASE,
                    'Set-Cookie': `${COOKIE}=${expected}; Path=${BASE}; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
                    'Cache-Control': 'no-store'
                }
            });
        }
        return page({ error: true, status: 401 });
    }

    const cookie = readCookie(request, COOKIE);
    if (!cookie || !safeEqual(cookie, expected)) {
        return page({ status: 401 });
    }

    const response = await next();
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
