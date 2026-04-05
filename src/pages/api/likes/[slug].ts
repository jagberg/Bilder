import type { APIRoute } from 'astro';

export const prerender = false;

function kv(locals: App.Locals): KVNamespace | null {
  return (locals as any).runtime?.env?.LIKES ?? null;
}

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const store = kv(locals);
    const raw = store ? await store.get(`likes:${params.slug}`) : null;
    return Response.json({ count: parseInt(raw ?? '0') });
  } catch {
    return Response.json({ count: 0 });
  }
};

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const store = kv(locals);
    if (!store) return Response.json({ count: 0 });
    const raw = await store.get(`likes:${params.slug}`);
    const next = parseInt(raw ?? '0') + 1;
    await store.put(`likes:${params.slug}`, String(next));
    return Response.json({ count: next });
  } catch {
    return Response.json({ count: 0 });
  }
};
