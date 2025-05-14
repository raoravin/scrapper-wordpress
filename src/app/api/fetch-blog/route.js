// app/api/fetch-blog/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing blog URL' }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    return NextResponse.json({ content: response.data }, { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}
