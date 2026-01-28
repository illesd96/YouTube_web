import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse filters
  const region = searchParams.get('region') || undefined;
  const niche = searchParams.get('niche') || undefined;
  const bucket = searchParams.get('bucket') || undefined;
  const shorts = searchParams.get('shorts');
  const hoursAgo = parseInt(searchParams.get('hours') || '24');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build where clause
  const where: any = {};

  // Time window filter
  const timeThreshold = new Date();
  timeThreshold.setHours(timeThreshold.getHours() - hoursAgo);
  where.seenAt = { gte: timeThreshold };

  // Region filter
  if (region) {
    where.regionCode = region;
  }

  // Bucket filter
  if (bucket && ['viral', 'stable', 'low'].includes(bucket)) {
    where.bucket = bucket;
  }

  // Niche filter
  if (niche) {
    where.nicheTags = { has: niche };
  }

  // Shorts filter
  if (shorts !== null) {
    const isShort = shorts === 'true';
    where.video = {
      isShort,
    };
  }

  try {
    // Fetch feed hits with video data
    const feedHits = await prisma.feedHit.findMany({
      where,
      include: {
        video: true,
      },
      orderBy: {
        viewsPerHour: 'desc',
      },
      take: limit,
      skip: offset,
    }).catch(() => []);

    // Get total count for pagination
    const total = await prisma.feedHit.count({ where }).catch(() => 0);

    // Format response
    const results = feedHits.map((hit) => ({
      videoId: hit.videoId,
      title: hit.video.title,
      channelTitle: hit.video.channelTitle,
      thumbnailUrl: hit.video.thumbnailUrl,
      publishedAt: hit.video.publishedAt,
      isShort: hit.video.isShort,
      viewCount: hit.video.viewCount.toString(),
      viewsPerHour: hit.viewsPerHour,
      bucket: hit.bucket,
      nicheTags: hit.nicheTags,
      regionCode: hit.regionCode,
      categoryId: hit.categoryId,
      seenAt: hit.seenAt,
    }));

    return NextResponse.json({
      results,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching trending videos:', error);
    // Return empty results instead of error
    return NextResponse.json({
      results: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false,
      },
    });
  }
}
