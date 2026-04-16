import type { APIRoute } from 'astro';

export const prerender = false;

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5001';

export const POST: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id || !/^\d+$/.test(id)) {
    return Response.json({ error: 'Invalid match id' }, { status: 400 });
  }

  try {
    const res = await fetch(`${API}/similar-matches/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to approve match', detail: String(err) },
      { status: 502 }
    );
  }
};
