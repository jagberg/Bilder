// Flask API client — see C:\Code\Api.Builder.LegalProceedings\specs\api-reference.md
// All JSON keys and query parameters use camelCase.

export interface Builder {
  id: number;
  builderName: string;
  isActive: boolean;
  scrapeIntervalDays: number;
  lastScrapedAt: string | null;
  aliases: string[];
}

export interface Hearing {
  externalId: string;
  matchedAlias: string;
  caseNumber: string;
  parties: string;
  listingDate: string;
  listingTime: string;
  court: string;
  location: string;
  courtroom: string;
  jurisdiction: string;
  listingType: string;
  presidingOfficer: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SimilarMatch {
  id: number | null;            // null when ephemeral (preview only, not persisted)
  searchedAlias: string;
  externalId: string;
  caseNumber: string;
  parties: string;
  listingDate: string | null;
  createdAt: string | null;
}

export interface HearingsResponse {
  builderName: string | null;   // null when ephemeral
  searchedFor: string;
  resolvedAlias: boolean;
  ephemeral: boolean;           // true when nothing was persisted
  aliases: string[];
  total: number;
  offset: number;
  limit: number;
  hearings: Hearing[];
  similarMatches: SimilarMatch[];
}

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5001';

export async function getBuilders(): Promise<Builder[]> {
  const res = await fetch(`${API}/builders`);
  if (!res.ok) throw new Error(`GET /builders → ${res.status}`);
  const data = await res.json();
  return data.builders;
}

export interface HearingsOptions {
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export async function getHearings(
  name: string,
  opts: HearingsOptions = {}
): Promise<HearingsResponse | null> {
  const params = new URLSearchParams();
  if (opts.fromDate) params.set('fromDate', opts.fromDate);
  if (opts.toDate) params.set('toDate', opts.toDate);
  if (opts.limit != null) params.set('limit', String(opts.limit));
  if (opts.offset != null) params.set('offset', String(opts.offset));

  const url = `${API}/builders/${encodeURIComponent(name)}/hearings?${params}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /builders/${name}/hearings → ${res.status}`);
  return res.json();
}

// Approve a similar match — adds it as an alias on the builder it appeared
// under. Calls our own proxy route to avoid CORS.
export async function approveSimilarMatch(id: number): Promise<void> {
  const res = await fetch(`/api/similar-matches/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error(`approve ${id} → ${res.status}`);
}

// Dismiss a similar match — marks reviewed without adding an alias.
export async function dismissSimilarMatch(id: number): Promise<void> {
  const res = await fetch(`/api/similar-matches/${id}/dismiss`, { method: 'POST' });
  if (!res.ok) throw new Error(`dismiss ${id} → ${res.status}`);
}

// Filter a list of builders by a case-insensitive substring match on
// the canonical name or any alias.
export function filterBuilders(builders: Builder[], q: string): Builder[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return builders.filter(b => {
    if (b.builderName.toLowerCase().includes(needle)) return true;
    return b.aliases.some(a => a.toLowerCase().includes(needle));
  });
}
