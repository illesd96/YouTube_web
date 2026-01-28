import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import { youtubeClient } from '@/lib/youtube-client';
import { classifyVideo } from '@/lib/video-classifier';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CategoryCache {
  [regionCode: string]: {
    categories: string[];
    fetchedAt: Date;
  };
}

// In-memory cache for categories (refreshed daily)
let categoryCache: CategoryCache = {};

async function getCategoriesForRegion(regionCode: string): Promise<string[]> {
  const now = new Date();
  const cached = categoryCache[regionCode];

  // Check if cache exists and is less than 24 hours old
  if (
    cached &&
    now.getTime() - cached.fetchedAt.getTime() < 24 * 60 * 60 * 1000
  ) {
    return cached.categories;
  }

  // Fetch fresh categories
  try {
    const categories = await youtubeClient.getVideoCategories(regionCode);
    const categoryIds = categories
      .filter((cat) => cat.id && cat.snippet?.assignable)
      .map((cat) => cat.id!);

    categoryCache[regionCode] = {
      categories: categoryIds,
      fetchedAt: now,
    };

    return categoryIds;
  } catch (error) {
    console.error(`Failed to fetch categories for ${regionCode}:`, error);
    // Return cached data if available, otherwise empty array
    return cached?.categories || [];
  }
}

async function collectTrendingVideos(runId: string) {
  const regions = config.regions;
  let totalVideosProcessed = 0;
  let totalFeedHitsCreated = 0;

  for (const regionCode of regions) {
    console.log(`Processing region: ${regionCode}`);

    // Get categories for this region
    const categoryIds = await getCategoriesForRegion(regionCode);
    
    // Also fetch without category filter (general trending)
    const categoriesToFetch = ['', ...categoryIds];

    for (const categoryId of categoriesToFetch) {
      try {
        console.log(
          `Fetching videos for ${regionCode}/${categoryId || 'all'}`
        );

        // Fetch most popular videos
        const videos = await youtubeClient.getMostPopularVideos(
          regionCode,
          categoryId || undefined,
          50
        );

        console.log(`Retrieved ${videos.length} videos`);

        // Process each video
        for (const video of videos) {
          const classified = classifyVideo(video);
          if (!classified) continue;

          // Upsert video record
          await prisma.video.upsert({
            where: { videoId: classified.videoId },
            update: {
              viewCount: classified.viewCount,
              likeCount: classified.likeCount,
              commentCount: classified.commentCount,
              lastSeenAt: new Date(),
            },
            create: {
              videoId: classified.videoId,
              title: classified.title,
              channelId: classified.channelId,
              channelTitle: classified.channelTitle,
              publishedAt: classified.publishedAt,
              durationSeconds: classified.durationSeconds,
              isShort: classified.isShort,
              thumbnailUrl: classified.thumbnailUrl,
              viewCount: classified.viewCount,
              likeCount: classified.likeCount,
              commentCount: classified.commentCount,
            },
          });

          totalVideosProcessed++;

          // Create feed hit (with unique constraint protection)
          try {
            await prisma.feedHit.create({
              data: {
                runId,
                videoId: classified.videoId,
                regionCode,
                categoryId: categoryId || 'all',
                viewsPerHour: classified.viewsPerHour,
                bucket: classified.bucket,
                nicheTags: classified.nicheTags,
              },
            });
            totalFeedHitsCreated++;
          } catch (error: any) {
            // Ignore unique constraint violations (duplicate feed hits)
            if (error.code !== 'P2002') {
              throw error;
            }
          }
        }

        // Rate limiting: small delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Error processing ${regionCode}/${categoryId}:`,
          error
        );
        // Continue with next category instead of failing entire run
      }
    }
  }

  return { totalVideosProcessed, totalFeedHitsCreated };
}

export async function GET(request: NextRequest) {
  // Check required environment variables
  if (!config.youtube.apiKey || !config.database.url || !config.cron.secret) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing required environment variables' },
      { status: 500 }
    );
  }

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${config.cron.secret}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Create collector run
  const run = await prisma.collectorRun.create({
    data: {
      status: 'running',
    },
  });

  try {
    console.log(`Starting collector run: ${run.runId}`);
    
    const stats = await collectTrendingVideos(run.runId);

    // Mark run as complete
    await prisma.collectorRun.update({
      where: { runId: run.runId },
      data: {
        status: 'ok',
        finishedAt: new Date(),
      },
    });

    console.log(`Collector run ${run.runId} completed successfully`);
    console.log(`Stats:`, stats);

    return NextResponse.json({
      success: true,
      runId: run.runId,
      stats,
    });
  } catch (error: any) {
    console.error(`Collector run ${run.runId} failed:`, error);

    // Mark run as error
    await prisma.collectorRun.update({
      where: { runId: run.runId },
      data: {
        status: 'error',
        error: error.message,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: false,
        runId: run.runId,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
