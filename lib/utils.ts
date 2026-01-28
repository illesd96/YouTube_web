/**
 * Utility functions for the YouTube Trending Collector
 */

/**
 * Validates region code format
 */
export function isValidRegionCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Formats a BigInt for JSON serialization
 */
export function formatBigInt(value: bigint | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.toString();
}

/**
 * Safely parses an integer with a default value
 */
export function parseIntWithDefault(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Formats views per hour for display
 */
export function formatViewsPerHour(vph: number): string {
  if (vph >= 1000000) {
    return `${(vph / 1000000).toFixed(1)}M/hr`;
  } else if (vph >= 1000) {
    return `${(vph / 1000).toFixed(1)}K/hr`;
  } else {
    return `${Math.round(vph)}/hr`;
  }
}

/**
 * Formats duration in seconds to readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Gets a user-friendly bucket name
 */
export function getBucketLabel(bucket: string): string {
  const labels: Record<string, string> = {
    viral: '🔥 Viral',
    stable: '📈 Stable',
    low: '📉 Low',
  };
  return labels[bucket] || bucket;
}
