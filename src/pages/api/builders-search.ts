import type { APIRoute } from 'astro';
import { getBuilders, getHearings, filterBuilders } from '../../lib/builders-api';
import type { Builder, Hearing } from '../../lib/builders-api';

export const prerender = false;

const PREVIEW_HEARINGS = 5;

interface GroupResult {
  builder: Builder;
  hearings: Hearing[];
  total: number;
  similarMatchCount: number;
}

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

  if (!q.trim()) {
    return Response.json({ total: 0, offset, limit, groups: [] });
  }

  try {
    const all = await getBuilders();
    const matches = filterBuilders(all, q);
    const slice = matches.slice(offset, offset + limit);

    const groups: GroupResult[] = await Promise.all(
      slice.map(async (builder) => {
        try {
          const res = await getHearings(builder.builderName, { limit: PREVIEW_HEARINGS, offset: 0 });
          return {
            builder,
            hearings: res?.hearings ?? [],
            total: res?.total ?? 0,
            similarMatchCount: res?.similarMatches?.length ?? 0,
          };
        } catch {
          return { builder, hearings: [], total: 0, similarMatchCount: 0 };
        }
      })
    );

    // Fallback: no local matches → ask the API to scrape/search upstream
    if (matches.length === 0 && offset === 0) {
      try {
        const fallback = await getHearings(q, { limit: PREVIEW_HEARINGS, offset: 0 });
        if (fallback && !fallback.ephemeral) {
          const displayName = fallback.builderName ?? q;
          const syntheticBuilder: Builder = {
            id: 0,
            builderName: displayName,
            isActive: true,
            scrapeIntervalDays: 1,
            lastScrapedAt: null,
            aliases: fallback.aliases,
          };
          return Response.json({
            total: 1,
            offset: 0,
            limit,
            groups: [{
              builder: syntheticBuilder,
              hearings: fallback.hearings,
              total: fallback.total,
              similarMatchCount: fallback.similarMatches?.length ?? 0,
            }],
          });
        }
      } catch {
        // Fallback scrape failed — return empty results
      }
    }

    return Response.json({
      total: matches.length,
      offset,
      limit,
      groups,
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to load builders', detail: String(err) },
      { status: 502 }
    );
  }
};
