import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Time thresholds
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch stats for last 24h
    const stats24h = await prisma.feedHit.groupBy({
      by: ['bucket'],
      where: {
        seenAt: { gte: last24h },
      },
      _count: true,
    });

    // Fetch stats for last 7d
    const stats7d = await prisma.feedHit.groupBy({
      by: ['bucket'],
      where: {
        seenAt: { gte: last7d },
      },
      _count: true,
    });

    // Count unique videos in last 24h
    const uniqueVideos24h = await prisma.feedHit.findMany({
      where: { seenAt: { gte: last24h } },
      select: { videoId: true },
      distinct: ['videoId'],
    });

    // Count unique videos in last 7d
    const uniqueVideos7d = await prisma.feedHit.findMany({
      where: { seenAt: { gte: last7d } },
      select: { videoId: true },
      distinct: ['videoId'],
    });

    // Count shorts vs long-form in last 24h
    const shortsCount24h = await prisma.feedHit.count({
      where: {
        seenAt: { gte: last24h },
        video: { isShort: true },
      },
    });

    const longFormCount24h = await prisma.feedHit.count({
      where: {
        seenAt: { gte: last24h },
        video: { isShort: false },
      },
    });

    // Get last successful run
    const lastRun = await prisma.collectorRun.findFirst({
      where: { status: 'ok' },
      orderBy: { finishedAt: 'desc' },
    });

    // Format bucket stats
    const formatBucketStats = (stats: any[]) => ({
      viral: stats.find((s) => s.bucket === 'viral')?._count || 0,
      stable: stats.find((s) => s.bucket === 'stable')?._count || 0,
      low: stats.find((s) => s.bucket === 'low')?._count || 0,
    });

    return NextResponse.json({
      last24h: {
        totalHits: stats24h.reduce((sum, s) => sum + s._count, 0),
        uniqueVideos: uniqueVideos24h.length,
        byBucket: formatBucketStats(stats24h),
        shorts: shortsCount24h,
        longForm: longFormCount24h,
      },
      last7d: {
        totalHits: stats7d.reduce((sum, s) => sum + s._count, 0),
        uniqueVideos: uniqueVideos7d.length,
        byBucket: formatBucketStats(stats7d),
      },
      lastRun: lastRun
        ? {
            runId: lastRun.runId,
            finishedAt: lastRun.finishedAt,
            status: lastRun.status,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error fetching overview stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
