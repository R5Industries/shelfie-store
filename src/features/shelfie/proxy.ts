import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Forwards requests to the Shelfie backend API Worker (`apps/api`).
 * Prefers Cloudflare Worker service binding `INTAKE_API`.
 * Falls back to `SHELFIE_API_URL` HTTP endpoint if configured,
 * or returns a clear 503 response if neither is available.
 */
export async function forwardToShelfieApi(context: APIContext): Promise<Response> {
  const bindings = env as unknown as {
    INTAKE_API?: { fetch: (request: Request | string, init?: RequestInit) => Promise<Response> };
    SHELFIE_API_URL?: string;
  };

  if (bindings.INTAKE_API) {
    return bindings.INTAKE_API.fetch(context.request);
  }

  if (bindings.SHELFIE_API_URL) {
    const incomingUrl = new URL(context.request.url);
    const targetUrl = new URL(
      incomingUrl.pathname + incomingUrl.search,
      bindings.SHELFIE_API_URL,
    );

    const headers = new Headers(context.request.headers);
    headers.set('host', targetUrl.host);

    const init: RequestInit = {
      method: context.request.method,
      headers,
      body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : await context.request.arrayBuffer(),
      redirect: 'follow',
    };

    return fetch(targetUrl.toString(), init);
  }

  return new Response(
    JSON.stringify({
      error: 'Shelfie API service binding (INTAKE_API) is not available.',
      status: 503,
      hint: 'In local development, run `bun run preview:store:full` to start both the storefront and apps/api.',
    }),
    {
      status: 503,
      headers: {
        'content-type': 'application/json',
      },
    },
  );
}
