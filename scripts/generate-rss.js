#!/usr/bin/env node
/*
 * RSS feed generator for blogboy-citadel
 * - Reads properties/main-config.json (document_root) and properties/viewer-config.json (rss_feed_url, header)
 * - Scans Markdown files under document_root and generates RSS 2.0 feed
 * - If rss_feed_url is empty or output path cannot be created, generation is skipped silently
 * - Designed to be run manually or in CI (build-time), not in browser
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

async function readJsonSafe(file) {
  try {
    const buf = await fsp.readFile(file, 'utf8');
    return JSON.parse(buf);
  } catch (e) {
    return {};
  }
}

function normalizePath(p) {
  if (!p) return 'posts/';
  p = String(p).trim();
  if (!p) return 'posts/';
  if (p.startsWith('./')) p = p.slice(2);
  if (p.startsWith('/')) p = p.slice(1);
  const hasExt = /\.[a-zA-Z0-9]+$/.test(p);
  if (!hasExt && !p.endsWith('/')) p += '/';
  return p;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\'/g, '&apos;');
}

function stripMarkdown(md) {
  let s = md || '';
  // Remove code blocks
  s = s.replace(/```[\s\S]*?```/g, '');
  // Remove images/links while keeping text
  s = s.replace(/!\[[^\]]*\]\([^\)]*\)/g, '');
  s = s.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
  // Remove emphasis/bold/inline code
  s = s.replace(/[\*_`>#~\-]+/g, ' ');
  // Collapse spaces
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function toRfc822Date(d) {
  try {
    return new Date(d).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

async function fileListRecursive(rootDir) {
  const res = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else if (ent.isFile() && /\.md$/i.test(ent.name)) {
        res.push(full);
      }
    }
  }
  await walk(rootDir);
  return res;
}

async function tryMkdirp(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

async function maybeRead(file) {
  try {
    return await fsp.readFile(file, 'utf8');
  } catch {
    return null;
  }
}

async function main() {
  const repoRoot = process.cwd();
  const mainCfgPath = path.join(repoRoot, 'properties', 'main-config.json');
  const viewerCfgPath = path.join(repoRoot, 'properties', 'viewer-config.json');
  const tocPath = path.join(repoRoot, 'properties', 'toc.json');

  const mainCfg = await readJsonSafe(mainCfgPath);
  const viewerCfg = await readJsonSafe(viewerCfgPath);
  const toc = await readJsonSafe(tocPath);

  const docRoot = normalizePath((mainCfg.list && mainCfg.list.document_root) || mainCfg.document_root || 'posts/');

  // rss_feed_url rules
  const rssFeedUrl = (viewerCfg.viewer && typeof viewerCfg.viewer.rss_feed_url !== 'undefined')
    ? String(viewerCfg.viewer.rss_feed_url || '')
    : String(viewerCfg.rss_feed_url || '');

  if (!rssFeedUrl || !rssFeedUrl.trim()) {
    console.log('[RSS] rss_feed_url is empty - skipping generation.');
    return;
  }

  // Resolve output path inside repo
  let outRel = rssFeedUrl.trim();
  // Remove query/hash if any
  outRel = outRel.split('?')[0].split('#')[0];
  if (outRel.startsWith('/')) outRel = outRel.slice(1);
  const outPath = path.join(repoRoot, outRel);

  // Build metadata map from toc.json: path -> { title, date, author }
  const metaMap = new Map();
  try {
    for (const [, cat] of Object.entries(toc || {})) {
      if (cat && Array.isArray(cat.files)) {
        for (const f of cat.files) {
          if (f && f.path) {
            metaMap.set(String(f.path), {
              title: f.title || null,
              date: f.date || null,
              author: f.author || null,
            });
          }
        }
      }
    }
  } catch {}

  const rootDir = path.join(repoRoot, docRoot);
  const mdFiles = await fileListRecursive(rootDir);

  const items = [];
  for (const full of mdFiles) {
    const relFromDocRoot = path.relative(rootDir, full).split(path.sep).join('/');
    // If toc.json exists and has entries, include only files listed in toc (main list)
    if (metaMap.size > 0 && !metaMap.has(relFromDocRoot)) {
      continue;
    }
    const content = await maybeRead(full);

    let title = null;
    if (metaMap.has(relFromDocRoot)) {
      title = metaMap.get(relFromDocRoot).title || null;
    }
    if (!title && content) {
      const m = content.match(/^#\s+(.+)$/m);
      if (m) title = m[1].trim();
    }
    if (!title) {
      title = path.basename(relFromDocRoot, path.extname(relFromDocRoot));
    }

    // date: toc date -> file mtime
    let dateStr = null;
    if (metaMap.has(relFromDocRoot) && metaMap.get(relFromDocRoot).date) {
      dateStr = metaMap.get(relFromDocRoot).date;
    }
    let pubDate;
    if (dateStr) {
      const d = new Date(dateStr);
      pubDate = isNaN(d.getTime()) ? new Date() : d;
    } else {
      try {
        const st = await fsp.stat(full);
        pubDate = st.mtime;
      } catch {
        pubDate = new Date();
      }
    }

    // description: first non-heading paragraph
    let description = '';
    if (content) {
      const lines = content.split(/\r?\n/);
      let acc = [];
      for (const line of lines) {
        const t = line.trim();
        if (!t) {
          if (acc.length > 0) break; // paragraph ended
          continue;
        }
        if (/^\s*#/.test(t)) {
          if (acc.length > 0) break;
          else continue; // skip headings
        }
        if (/^```/.test(t)) continue;
        if (/^</.test(t)) continue; // html blocks
        acc.push(t);
        if (acc.join(' ').length > 400) break;
      }
      description = stripMarkdown(acc.join(' '));
    }

    const link = `/${'viewer.html?file=' + docRoot + relFromDocRoot}`;

    items.push({
      title: escapeXml(title),
      link: escapeXml(link),
      guid: escapeXml(link),
      pubDate: toRfc822Date(pubDate),
      description: escapeXml(description)
    });
  }

  // Sort newest first by pubDate
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Channel info
  const headerTitle = (viewerCfg.header && viewerCfg.header.title) || (mainCfg.header && mainCfg.header.title) || 'Site Feed';
  const headerSubtitle = (mainCfg.header && mainCfg.header.subtitle) || '';
  const siteLocale = viewerCfg.site_locale || mainCfg.site_locale || 'en';

  const now = new Date();
  const channelXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(headerTitle)}</title>`,
    `<link>/</link>`,
    `<description>${escapeXml(headerSubtitle || 'RSS Feed')}</description>`,
    `<language>${escapeXml(siteLocale)}</language>`,
    `<lastBuildDate>${toRfc822Date(now)}</lastBuildDate>`,
    ...items.map(it => (
      ['<item>',
       `<title>${it.title}</title>`,
       `<link>${it.link}</link>`,
       `<guid isPermaLink="false">${it.guid}</guid>`,
       `<pubDate>${it.pubDate}</pubDate>`,
       it.description ? `<description>${it.description}</description>` : '',
       '</item>'].filter(Boolean).join('\n')
    )),
    '</channel>',
    '</rss>'
  ].join('\n');

  // Ensure directory exists
  const outDir = path.dirname(outPath);
  const ok = await tryMkdirp(outDir);
  if (!ok) {
    console.log(`[RSS] Cannot create directory for ${outPath}. Skipping generation.`);
    return;
  }

  // Skip write if unchanged
  const prev = await maybeRead(outPath);
  if (prev && prev === channelXml) {
    console.log(`[RSS] No changes. ${outRel} is up-to-date.`);
    return;
  }

  try {
    await fsp.writeFile(outPath, channelXml, 'utf8');
    console.log(`[RSS] Generated ${outRel} with ${items.length} item(s).`);
  } catch (e) {
    console.log(`[RSS] Failed to write ${outRel}:`, e && e.message ? e.message : e);
  }
}

main().catch(err => {
  console.error('[RSS] Unexpected error:', err);
  process.exitCode = 1;
});
