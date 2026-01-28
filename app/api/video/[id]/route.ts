import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;

  try {
    // Fetch video with all feed hits
    const video = await prisma.video.findUnique({
      where: { videoId },
      include: {
        feedHits: {
          orderBy: { seenAt: 'desc' },
          take: 100, // Limit to last 100 appearances
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      videoId: video.videoId,
      title: video.title,
      channelId: video.channelId,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt,
      durationSeconds: video.durationSeconds,
      isShort: video.isShort,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount.toString(),
      likeCount: video.likeCount?.toString() || null,
      commentCount: video.commentCount?.toString() || null,
      firstSeenAt: video.firstSeenAt,
      lastSeenAt: video.lastSeenAt,
      appearances: video.feedHits.map((hit) => ({
        regionCode: hit.regionCode,
        categoryId: hit.categoryId,
        seenAt: hit.seenAt,
        viewsPerHour: hit.viewsPerHour,
        bucket: hit.bucket,
        nicheTags: hit.nicheTags,
      })),
      stats: {
        totalAppearances: video.feedHits.length,
        regions: [...new Set(video.feedHits.map((h) => h.regionCode))],
        buckets: {
          viral: video.feedHits.filter((h) => h.bucket === 'viral').length,
          stable: video.feedHits.filter((h) => h.bucket === 'stable').length,
          low: video.feedHits.filter((h) => h.bucket === 'low').length,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Error fetching video ${videoId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch video details' },
      { status: 500 }
    );
  }
}
