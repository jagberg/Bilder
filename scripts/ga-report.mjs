/**
 * GA4 Data API + Search Console + D1 likes report runner.
 *
 * Env (set in .env):
 *   GA_PROPERTY_ID                  — numeric GA4 property ID (Admin → Property Settings)
 *   GOOGLE_APPLICATION_CREDENTIALS  — absolute path to service-account JSON key
 *   SC_SITE_URL                     — optional; default "sc-domain:bilder.com.au"
 *
 * Usage:
 *   node scripts/ga-report.mjs                      # overview, last 28 days
 *   node scripts/ga-report.mjs --days=7             # overview, last 7 days
 *   node scripts/ga-report.mjs --report=pages       # top pages
 *   node scripts/ga-report.mjs --report=sources     # traffic sources
 *   node scripts/ga-report.mjs --report=flow        # pages visited in sessions that landed on --landing
 *   node scripts/ga-report.mjs --report=flow --landing=/architect-plans/
 *   node scripts/ga-report.mjs --report=queries     # top Search Console queries (requires SC access)
 *   node scripts/ga-report.mjs --report=likes       # per-page likes from D1 (requires wrangler auth)
 *   node scripts/ga-report.mjs --report=all         # overview + pages + sources + flow + queries + likes
 *   node scripts/ga-report.mjs --from=2026-01-01 --to=2026-04-18
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';

// Minimal .env loader (project doesn't use dotenv)
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
try {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)=?(.*)$/);
    return m ? [m[1], m[2] || true] : [a, true];
  }),
);

const PROPERTY_ID = process.env.GA_PROPERTY_ID;
if (!PROPERTY_ID) {
  console.error('Missing GA_PROPERTY_ID in .env');
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Missing GOOGLE_APPLICATION_CREDENTIALS in .env (path to service-account JSON)');
  process.exit(1);
}

const days     = Number(args.days || 28);
const today    = new Date().toISOString().slice(0, 10);
const fromDate = args.from || new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const toDate   = args.to || today;
const report   = args.report || 'overview';
const landing  = args.landing || '/';
const scSite   = process.env.SC_SITE_URL || 'sc-domain:bilder.com.au';

const client = new BetaAnalyticsDataClient();
const property = `properties/${PROPERTY_ID}`;
const dateRanges = [{ startDate: fromDate, endDate: toDate }];

function fmtRows(rows, headers) {
  if (!rows?.length) return '  (no rows)\n';
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)),
  );
  const pad = (s, w) => String(s).padEnd(w);
  const sep = widths.map(w => '-'.repeat(w)).join('  ');
  const head = headers.map((h, i) => pad(h, widths[i])).join('  ');
  const body = rows.map(r => r.map((c, i) => pad(c ?? '', widths[i])).join('  ')).join('\n');
  return `  ${head}\n  ${sep}\n  ${body.split('\n').map(l => '  ' + l).join('\n')}\n`;
}

async function overview() {
  const [res] = await client.runReport({
    property,
    dateRanges,
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
      { name: 'engagementRate' },
    ],
  });
  const m = res.rows?.[0]?.metricValues?.map(v => v.value) || [];
  console.log(`\nOVERVIEW  ${fromDate} → ${toDate}`);
  console.log(`  Active users        ${m[0] ?? '-'}`);
  console.log(`  New users           ${m[1] ?? '-'}`);
  console.log(`  Sessions            ${m[2] ?? '-'}`);
  console.log(`  Page views          ${m[3] ?? '-'}`);
  console.log(`  Avg session (s)     ${m[4] ? Number(m[4]).toFixed(1) : '-'}`);
  console.log(`  Bounce rate         ${m[5] ? (Number(m[5]) * 100).toFixed(1) + '%' : '-'}`);
  console.log(`  Engagement rate     ${m[6] ? (Number(m[6]) * 100).toFixed(1) + '%' : '-'}`);
}

async function pages() {
  const [res] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 25,
  });
  const rows = (res.rows || []).map(r => [
    r.dimensionValues[0].value,
    (r.dimensionValues[1].value || '').slice(0, 50),
    r.metricValues[0].value,
    r.metricValues[1].value,
    Number(r.metricValues[2].value).toFixed(1),
  ]);
  console.log(`\nTOP PAGES  ${fromDate} → ${toDate}`);
  console.log(fmtRows(rows, ['path', 'title', 'views', 'users', 'avg_s']));
}

async function sources() {
  const [res] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 25,
  });
  const rows = (res.rows || []).map(r => [
    r.dimensionValues[0].value,
    r.dimensionValues[1].value,
    r.metricValues[0].value,
    r.metricValues[1].value,
    (Number(r.metricValues[2].value) * 100).toFixed(1) + '%',
  ]);
  console.log(`\nTRAFFIC SOURCES  ${fromDate} → ${toDate}`);
  console.log(fmtRows(rows, ['source', 'medium', 'sessions', 'users', 'engaged']));
}

async function flow() {
  // Pages viewed in sessions whose landing page was EXACTLY `landing`, excluding the landing itself.
  const [res] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'landingPage',
              stringFilter: { matchType: 'EXACT', value: landing },
            },
          },
          {
            notExpression: {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'EXACT', value: landing },
              },
            },
          },
        ],
      },
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 25,
  });
  const rows = (res.rows || []).map(r => [
    r.dimensionValues[0].value,
    r.metricValues[0].value,
    r.metricValues[1].value,
  ]);
  console.log(`\nSESSION FLOW — next pages after landing on "${landing}"  ${fromDate} → ${toDate}`);
  console.log(fmtRows(rows, ['path', 'views', 'users']));

  // Also show landing itself with bounce rate for context
  const [landingRes] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'landingPagePlusQueryString' }],
    metrics: [
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViewsPerSession' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 15,
  });
  const landingRows = (landingRes.rows || []).map(r => [
    r.dimensionValues[0].value,
    r.metricValues[0].value,
    (Number(r.metricValues[1].value) * 100).toFixed(1) + '%',
    Number(r.metricValues[2].value).toFixed(1),
    Number(r.metricValues[3].value).toFixed(2),
  ]);
  console.log(`TOP LANDING PAGES  ${fromDate} → ${toDate}`);
  console.log(fmtRows(landingRows, ['landing', 'sessions', 'bounce', 'avg_s', 'pages/sess']));
}

async function queries() {
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const token = await auth.getAccessToken();
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(scSite)}/searchAnalytics/query`;
  const body = {
    startDate: fromDate,
    endDate: toDate,
    dimensions: ['query'],
    rowLimit: 25,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) {
      console.log(`\nSEARCH QUERIES — skipped (403).`);
      console.log(`→ Add the service-account email as a user on the Search Console property "${scSite}".`);
      console.log(`  https://search.google.com/search-console → Settings → Users and permissions → Add user (Restricted)`);
      return;
    }
    if (res.status === 404) {
      console.log(`\nSEARCH QUERIES — site "${scSite}" not found.`);
      console.log(`→ Set SC_SITE_URL in .env (e.g. "sc-domain:bilder.com.au" or "https://bilder.com.au/").`);
      return;
    }
    throw new Error(`Search Console API ${res.status}: ${text}`);
  }
  const data = await res.json();
  const rows = (data.rows || []).map(r => [
    r.keys[0],
    r.clicks,
    r.impressions,
    (r.ctr * 100).toFixed(1) + '%',
    r.position.toFixed(1),
  ]);
  console.log(`\nTOP SEARCH QUERIES  ${fromDate} → ${toDate}  (${scSite})`);
  console.log(fmtRows(rows, ['query', 'clicks', 'impr', 'ctr', 'pos']));

  // Also top pages from search
  const pageRes = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, dimensions: ['page'] }),
  });
  if (pageRes.ok) {
    const pd = await pageRes.json();
    const pageRows = (pd.rows || []).map(r => [
      new URL(r.keys[0]).pathname,
      r.clicks,
      r.impressions,
      (r.ctr * 100).toFixed(1) + '%',
      r.position.toFixed(1),
    ]);
    console.log(`TOP SEARCH LANDING PAGES  ${fromDate} → ${toDate}`);
    console.log(fmtRows(pageRows, ['path', 'clicks', 'impr', 'ctr', 'pos']));
  }
}

async function likes() {
  const db = args['likes-db'] || 'bilder-likes';
  const remote = args.local ? '--local' : '--remote';
  let raw;
  try {
    raw = execSync(
      `npx wrangler d1 execute ${db} --command "SELECT slug, COUNT(*) as likes FROM likes GROUP BY slug ORDER BY likes DESC LIMIT 50" ${remote} --json`,
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
    ).toString();
  } catch (err) {
    console.log(`\nLIKES — skipped: ${err.message.split('\n')[0]}`);
    console.log(`→ Ensure wrangler is authed: \`npx wrangler login\` or set CLOUDFLARE_API_TOKEN.`);
    return;
  }
  const jsonStart = raw.indexOf('[');
  if (jsonStart === -1) {
    console.log(`\nLIKES — no JSON in wrangler output.`);
    return;
  }
  const parsed = JSON.parse(raw.slice(jsonStart));
  const results = parsed[0]?.results || [];
  const rows = results.map(r => [r.slug, r.likes]);
  const total = results.reduce((s, r) => s + r.likes, 0);
  console.log(`\nLIKES (D1 ${db})`);
  console.log(`  Total likes: ${total} across ${results.length} slugs\n`);
  console.log(fmtRows(rows, ['slug', 'likes']));
}

const runners = { overview, pages, sources, flow, queries, likes };
const jobs = report === 'all'
  ? ['overview', 'pages', 'sources', 'flow', 'queries', 'likes']
  : [report];

let hadError = false;
for (const j of jobs) {
  if (!runners[j]) {
    console.error(`Unknown report: ${j}`);
    process.exit(1);
  }
  try {
    await runners[j]();
  } catch (err) {
    hadError = true;
    console.error(`\n${j} failed: ${err.message}`);
    if (err.code === 7 || /PERMISSION_DENIED/.test(err.message)) {
      console.error('→ Grant the service-account email Viewer access on the GA4 property.');
    }
  }
}
process.exit(hadError ? 1 : 0);
