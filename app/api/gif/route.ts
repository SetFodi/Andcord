import { NextRequest, NextResponse } from 'next/server';

const TENOR_API_KEY = process.env.TENOR_API_KEY || 'LIVDSRZULEUB';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '12';

    try {
        const endpoint = query
            ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=${limit}`
            : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=${limit}`;

        const res = await fetch(endpoint, {
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!res.ok) {
            throw new Error('Failed to fetch GIFs');
        }

        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error) {
        console.error('GIF API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch GIFs', results: [] },
            { status: 500 }
        );
    }
}
