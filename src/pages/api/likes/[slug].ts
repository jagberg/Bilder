import type { APIRoute } from 'astro';
import seeds from '../../../data/like-seeds.json';

export const prerender = false;

function kv(locals: App.Locals): KVNamespace | null {
  return (locals as any).runtime?.env?.LIKES ?? null;
}

function seed(slug: string): number {
  return (seeds as Record<string, number>)[slug] ?? 0;
}

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const store = kv(locals);
    const raw = store ? await store.get(`likes:${params.slug}`) : null;
    const count = parseInt(raw ?? '0') + seed(params.slug!);
    return Response.json({ count });
  } catch {
    return Response.json({ count: seed(params.slug!) });
  }
};

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const store = kv(locals);
    if (!store) return Response.json({ count: seed(params.slug!) });
    const raw = await store.get(`likes:${params.slug}`);
    const next = parseInt(raw ?? '0') + 1;
    await store.put(`likes:${params.slug}`, String(next));
    return Response.json({ count: next + seed(params.slug!) });
  } catch {
    return Response.json({ count: seed(params.slug!) });
  }
};
