import type { APIRoute } from 'astro';
import seeds from '../../../data/like-seeds.json';

export const prerender = false;

function db(locals: App.Locals): D1Database | null {
  return (locals as any).runtime?.env?.DB ?? null;
}

function seed(slug: string): number {
  return (seeds as Record<string, number>)[slug] ?? 0;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug!;
  try {
    const database = db(locals);
    if (!database) return Response.json({ count: seed(slug) });
    const row = await database
      .prepare('SELECT COUNT(*) AS count FROM likes WHERE slug = ?')
      .bind(slug)
      .first<{ count: number }>();
    return Response.json({ count: (row?.count ?? 0) + seed(slug) });
  } catch {
    return Response.json({ count: seed(slug) });
  }
};

export const POST: APIRoute = async ({ params, locals }) => {
  const slug = params.slug!;
  try {
    const database = db(locals);
    if (!database) return Response.json({ count: seed(slug) });
    await database
      .prepare('INSERT INTO likes (slug, created_at) VALUES (?, ?)')
      .bind(slug, new Date().toISOString())
      .run();
    const row = await database
      .prepare('SELECT COUNT(*) AS count FROM likes WHERE slug = ?')
      .bind(slug)
      .first<{ count: number }>();
    return Response.json({ count: (row?.count ?? 0) + seed(slug) });
  } catch {
    return Response.json({ count: seed(slug) });
  }
};
