import axios from 'axios';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const hide = searchParams.get('hide');

  if (!url) {
    return NextResponse.json({ error: 'Missing blog URL' }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'text/html',
      },
    });

    const $ = cheerio.load(response.data);

    // Remove the div with class "news_detail_person_detail"
    $('div.news_details_social_media_icons').remove();
    $('div.news_details_social_icon_desktop').remove();
    $('div.speechText').remove();
    $('div.details-story-wrapper').remove();
    $('img').remove();
    $('h2.news-description').remove();

    // if (hide == true) {
    //   $('div.details-story-wrapper').remove();
    // }


    // Try various selectors to find the main content
    const content =
      $('#page-content-wrapper').html() ||
      $('article').html() ||
      $('[id*="article"]').html() ||
      $('.amp-content').html() ||
      $('[class*="content"]').html() ||
      $('[class*="story"]').html();

    if (!content) {
      return NextResponse.json({ error: 'Content not found in known selectors' }, { status: 404 });
    }

    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch blog content' }, { status: 500 });
  }
}
