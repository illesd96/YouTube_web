import { google, youtube_v3 } from 'googleapis';
import { config } from './config';

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: config.youtube.apiKey,
    });
  }

  /**
   * Fetches most popular videos for a given region and category
   */
  async getMostPopularVideos(
    regionCode: string,
    categoryId?: string,
    maxResults: number = 50
  ): Promise<youtube_v3.Schema$Video[]> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        videoCategoryId: categoryId,
        maxResults,
      });

      return response.data.items || [];
    } catch (error) {
      console.error(
        `Error fetching videos for ${regionCode}/${categoryId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Fetches video categories for a given region
   * Cache this result as it rarely changes
   */
  async getVideoCategories(regionCode: string): Promise<youtube_v3.Schema$VideoCategory[]> {
    try {
      const response = await this.youtube.videoCategories.list({
        part: ['snippet'],
        regionCode,
      });

      return response.data.items || [];
    } catch (error) {
      console.error(
        `Error fetching categories for ${regionCode}:`,
        error
      );
      throw error;
    }
  }
}

// Singleton instance
export const youtubeClient = new YouTubeClient();
