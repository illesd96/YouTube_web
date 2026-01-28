import { youtube_v3 } from 'googleapis';
import { config } from './config';
import { classifyNiches } from './niches';

export interface ClassifiedVideo {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: Date;
  durationSeconds: number;
  isShort: boolean;
  thumbnailUrl: string;
  viewCount: bigint;
  likeCount: bigint | null;
  commentCount: bigint | null;
  viewsPerHour: number;
  bucket: 'viral' | 'stable' | 'low';
  nicheTags: string[];
}

/**
 * Parses ISO 8601 duration (e.g., "PT1H2M10S") and returns total seconds
 */
export function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Calculates views per hour based on current view count and video age
 */
export function calculateViewsPerHour(
  viewCount: bigint,
  publishedAt: Date
): number {
  const now = new Date();
  const ageMs = now.getTime() - publishedAt.getTime();
  const ageHours = Math.max(1, ageMs / (1000 * 60 * 60));
  
  return Number(viewCount) / ageHours;
}

/**
 * Determines performance bucket based on views per hour
 */
export function determinePerformanceBucket(
  viewsPerHour: number,
  isShort: boolean
): 'viral' | 'stable' | 'low' {
  const thresholds = isShort ? config.thresholds.short : config.thresholds.long;

  if (viewsPerHour >= thresholds.viral) {
    return 'viral';
  } else if (viewsPerHour >= thresholds.stable) {
    return 'stable';
  } else {
    return 'low';
  }
}

/**
 * Classifies a YouTube video with all metadata
 */
export function classifyVideo(video: youtube_v3.Schema$Video): ClassifiedVideo | null {
  // Ensure required fields exist
  if (
    !video.id ||
    !video.snippet?.title ||
    !video.snippet?.channelId ||
    !video.snippet?.channelTitle ||
    !video.snippet?.publishedAt ||
    !video.contentDetails?.duration ||
    !video.statistics?.viewCount
  ) {
    console.warn('Skipping video with missing required fields:', video.id);
    return null;
  }

  const durationSeconds = parseDuration(video.contentDetails.duration);
  const isShort = durationSeconds <= 60;
  
  const publishedAt = new Date(video.snippet.publishedAt);
  const viewCount = BigInt(video.statistics.viewCount);
  const viewsPerHour = calculateViewsPerHour(viewCount, publishedAt);
  const bucket = determinePerformanceBucket(viewsPerHour, isShort);
  
  const nicheTags = classifyNiches(
    video.snippet.title,
    video.snippet.channelTitle
  );

  const thumbnailUrl =
    video.snippet.thumbnails?.maxres?.url ||
    video.snippet.thumbnails?.high?.url ||
    video.snippet.thumbnails?.medium?.url ||
    video.snippet.thumbnails?.default?.url ||
    '';

  return {
    videoId: video.id,
    title: video.snippet.title,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt,
    durationSeconds,
    isShort,
    thumbnailUrl,
    viewCount,
    likeCount: video.statistics.likeCount ? BigInt(video.statistics.likeCount) : null,
    commentCount: video.statistics.commentCount ? BigInt(video.statistics.commentCount) : null,
    viewsPerHour,
    bucket,
    nicheTags,
  };
}
