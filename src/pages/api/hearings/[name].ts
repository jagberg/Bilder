import type { APIRoute } from 'astro';
import { getHearings } from '../../../lib/builders-api';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const name = params.name;
  if (!name) {
    return Response.json({ error: 'Missing builder name' }, { status: 400 });
  }

  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
  const fromDate = url.searchParams.get('fromDate') ?? undefined;
  const toDate = url.searchParams.get('toDate') ?? undefined;

  try {
    const result = await getHearings(name, { offset, limit, fromDate, toDate });
    if (result === null) {
      return Response.json({ error: `Builder not found: ${name}` }, { status: 404 });
    }
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: 'Failed to load hearings', detail: String(err) },
      { status: 502 }
    );
  }
};
