export type PerformanceBucket = 'viral' | 'stable' | 'low';

export type CollectorRunStatus = 'running' | 'ok' | 'error';

export interface VideoStats {
  viewsPerHour: number;
  bucket: PerformanceBucket;
}

export interface TrendingFilters {
  region?: string;
  niche?: string;
  bucket?: PerformanceBucket;
  isShort?: boolean;
  hoursAgo?: number;
  limit?: number;
  offset?: number;
}
