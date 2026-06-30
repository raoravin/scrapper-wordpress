import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

const GOOGLEBOT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; ' +
    '+http://www.google.com/bot.html) Chrome/120.0.6099.199 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  Connection: 'keep-alive',
};

async function fetchPage(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: GOOGLEBOT_HEADERS,
        signal: AbortSignal.timeout(30000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch {
      if (attempt < maxRetries - 1) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return null;
}

function extractJsonLd($) {
  let result = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (result) return;
    try {
      const data = JSON.parse($(el).html() || '');
      if (data && data['@type'] === 'NewsArticle') result = data;
    } catch {}
  });
  return result;
}

function findContentWrapper($) {
  for (const cls of ['story-content', 'apm-post-details', 'details-story-wrapper', 'details-content-story']) {
    const el = $(`.${cls}`);
    if (el.length) return el;
  }
  return null;
}

function extractTextFromElement($, el) {
  const clone = el.clone();
  clone.find('script, style, nav, footer, noscript').remove();
  clone
    .find('div')
    .filter((_, d) => /ad[_-]|banner|promo|social|share|bookmark|audio|speech/i.test($(d).attr('class') || ''))
    .remove();
  clone.find('audio, amp-audio').remove();
  clone.find('[class*="also-read"],[class*="related"],[class*="read-more"]').remove();

  const paragraphs = [];
  clone.find('p, h1, h2, h3, h4, h5, h6, li, blockquote').each((_, p) => {
    const text = $(p).text().trim();
    if (text && text.length > 5) paragraphs.push(text);
  });

  return paragraphs.length ? paragraphs.join('\n\n') : clone.text().replace(/\s+/g, ' ').trim();
}

function parseArticleContent($) {
  for (const selector of [
    '.story-content',
    '.apm-post-details',
    '.details-story-wrapper',
    '.details-content-story',
    'article',
  ]) {
    const el = $(selector).first();
    if (el.length) {
      const text = extractTextFromElement($, el);
      if (text && text.length > 100) return text;
    }
  }
  const jsonld = extractJsonLd($);
  if (jsonld?.articleBody) return String(jsonld.articleBody);
  return '';
}

function parseMetadata($) {
  const meta = {};
  meta.title = $('title').text().trim();
  meta.description = $('meta[name="description"]').attr('content') || '';
  meta.author = $('meta[name="author"]').attr('content') || '';
  meta.published_date = $('meta[property="article:published_time"]').attr('content') || '';
  meta.modified_date = $('meta[property="article:modified_time"]').attr('content') || '';
  meta.section = $('meta[property="article:section"]').attr('content') || '';
  meta.image_url = $('meta[property="og:image"]').attr('content') || '';
  meta.canonical_url = $('link[rel="canonical"]').attr('href') || '';

  const jsonld = extractJsonLd($);
  if (jsonld) {
    meta.headline = String(jsonld.headline || meta.title || '');
    meta.article_body_from_jsonld = jsonld.articleBody || '';
    if (jsonld.author && typeof jsonld.author === 'object' && jsonld.author.name) {
      meta.author = String(jsonld.author.name);
    }
  }
  return meta;
}

function extractJudgmentPdfLink($) {
  const wrapper = findContentWrapper($) || $('body');
  let pdfLink = '';
  wrapper.find('a[href]').each((_, a) => {
    if (pdfLink) return;
    const href = $(a).attr('href') || '';
    const text = $(a).text().trim().toLowerCase();
    if (
      href.toLowerCase().includes('.pdf') ||
      ['pdf', 'download pdf', 'judgment', 'click here'].includes(text)
    ) {
      pdfLink = href;
    }
  });
  return pdfLink;
}

function extractCitedCases($) {
  const wrapper = findContentWrapper($);
  if (!wrapper) return [];
  const text = wrapper.text();
  const patterns = [
    /\d{4}\s+LiveLaw\s+\([A-Z]+\)\s+\d+/g,
    /\(\d{4}\)\s+\d+\s+SCC\s+\d+/g,
    /AIR\s+\d{4}\s+SC\s+\d+/g,
    /\d{4}\s+SCC\s+OnLine\s+SC\s+\d+/g,
  ];
  const citations = new Set();
  for (const pat of patterns) {
    const matches = text.match(pat) || [];
    matches.forEach((m) => citations.add(m));
  }
  return Array.from(citations);
}

function extractHtmlContent($) {
  const wrapper = findContentWrapper($);
  if (!wrapper) return '';
  const clone = wrapper.clone();
  clone.find('script, style, nav, footer, noscript').remove();
  clone
    .find('div')
    .filter((_, d) => /ad[_-]|banner|promo|social|share|bookmark|audio|speech/i.test($(d).attr('class') || ''))
    .remove();
  clone.find('audio, amp-audio').remove();
  clone.find('amp-img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    $(el).replaceWith(`<img src="${src}" alt="${alt}">`);
  });
  const html = clone.html() || '';
  return html.length > 100 ? html : '';
}

function tryAmpUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes('/amp/')) {
      parsed.pathname = '/amp' + parsed.pathname;
      return parsed.toString();
    }
  } catch {}
  return null;
}

function detectFollowRedirectLink($) {
  const wrapper = findContentWrapper($);
  if (!wrapper) return null;
  let followUrl = null;
  wrapper.find('a[href]').each((_, a) => {
    if (followUrl) return;
    let href = $(a).attr('href') || '';
    if (href.startsWith('/')) href = 'https://www.livelaw.in' + href;
    if (href.includes('livelaw.in')) {
      try {
        const parsed = new URL(href);
        const path = parsed.pathname;
        if (
          ['/supreme-court/', '/high-court/', '/news-updates/', '/articles/', '/top-stories/'].some((x) =>
            path.includes(x)
          ) &&
          !path.includes('/sc-judgments/') &&
          !path.toLowerCase().endsWith('.pdf') &&
          !path.includes('/amp/')
        ) {
          followUrl = href;
        }
      } catch {}
    }
  });
  return followUrl;
}

async function scrapeArticle(url, followDepth = 1) {
  const result = {
    url,
    scraped_at: new Date().toISOString(),
    content: '',
    content_html: '',
    content_length: 0,
    pdf_link: '',
    cited_cases: [],
    content_id: '',
  };

  // 1. Try AMP version first — full untruncated content
  const ampUrl = tryAmpUrl(url);
  let ampSoup = null;
  if (ampUrl) {
    const ampHtml = await fetchPage(ampUrl);
    if (ampHtml) ampSoup = cheerio.load(ampHtml);
  }

  // 2. Fetch regular page
  const html = await fetchPage(url);
  if (!html && !ampSoup) {
    result.error = 'Failed to fetch page';
    return result;
  }

  const $ = html ? cheerio.load(html) : ampSoup;

  // 3. Extract metadata from regular page (richer structured data)
  Object.assign(result, parseMetadata($));

  // 4. Extract content — prefer AMP
  let content = '';
  let contentHtml = '';
  if (ampSoup) {
    content = parseArticleContent(ampSoup);
    contentHtml = extractHtmlContent(ampSoup);
  }

  // 5. Fallback to regular page if AMP didn't yield enough
  if (content.length < 200 && html) {
    const regularContent = parseArticleContent($);
    if (regularContent.length > content.length) {
      content = regularContent;
      contentHtml = extractHtmlContent($);
    }
  }

  result.content = content;
  result.content_html = contentHtml;
  result.content_length = content.length;

  // 6. Extract judgment PDF link
  result.pdf_link = extractJudgmentPdfLink($);

  // 7. Extract cited cases
  result.cited_cases = extractCitedCases($);

  // 8. Content ID from URL
  const idMatch = url.match(/-(\d+)$/);
  result.content_id = idMatch ? idMatch[1] : '';

  // 9. Audio URL (LiveLaw TTS)
  if (result.content_id) {
    result.audio_url = `https://www.livelaw.in/mp3/news/${result.content_id}.mp3`;
  }

  // 10. Auto-follow stubs/citation pages to get the full write-up
  if (followDepth > 0) {
    const followUrl = detectFollowRedirectLink(ampSoup || $);
    if (followUrl) {
      const followed = await scrapeArticle(followUrl, followDepth - 1);
      if (followed.content) {
        result.content = followed.content;
        result.content_html = followed.content_html;
        result.content_length = followed.content_length;
        if (!result.pdf_link && followed.pdf_link) result.pdf_link = followed.pdf_link;
        result.cited_cases = Array.from(new Set([...result.cited_cases, ...followed.cited_cases]));
        result.followed_url = followUrl;
      }
    }
  }

  return result;
}

export async function POST(request) {
  try {
    const body = await request.json();
    let url = (body.url || '').trim();

    if (!url) {
      return NextResponse.json({ success: false, error: 'No URL provided' }, { status: 400 });
    }

    if (!url.startsWith('http')) url = 'https://' + url;

    if (!url.includes('livelaw.in')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid LiveLaw URL' },
        { status: 400 }
      );
    }

    const data = await scrapeArticle(url, 1);

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json({ success: false, error: 'Error occurred: ' + err.message }, { status: 500 });
  }
}
