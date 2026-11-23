# coding-bot

A static prompt-workspace UI with an optional server-side AI endpoint.

## Run with an AI backend

GitHub Pages only serves static files; it cannot run `/api/prompt`. Sending the UI's POST request to a static GitHub Pages site therefore returns HTTP 405. Deploy this repository to a serverless host that supports Vercel Functions (for example, Vercel) to enable the included endpoint.

1. Import this repository into Vercel and deploy it. The function in `api/prompt.js` will be available at `/api/prompt`.
2. In the Vercel project settings, add the environment variable `OPENAI_API_KEY` with your provider API key, then redeploy. The key stays on the server and is not exposed in the browser.
3. Optionally set `OPENAI_MODEL` to a model available to your API account. The default is `gpt-4o-mini`.
4. Open the deployed site and use the prompt workspace. Its default endpoint, `/api/prompt`, is same-origin. If you already saved a different endpoint in the browser, set it back to `/api/prompt` and save.

The endpoint accepts `POST` JSON `{ "prompt": "..." }` and returns `{ "summary": "...", "steps": [], "code": "...", "previewHtml": "..." }`. It rejects empty prompts and prompts longer than 4,000 characters. Provider credentials must only be stored in the deployment's server-side environment variables.

The browser preview uses a sandboxed iframe with scripts disabled. Treat generated code as untrusted and review it before using it. This demo does not execute generated code or make changes to a repository.

## Static-only use

The page can still be hosted on GitHub Pages, but AI prompt submission requires an separately deployed backend. Enter that backend's URL in the workspace settings and configure its CORS policy to allow the page's origin.
