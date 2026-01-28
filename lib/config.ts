export const config = {
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  cron: {
    secret: process.env.CRON_SECRET || '',
  },
  regions: (process.env.REGIONS || 'US,CA,GB,AU,DE,CH').split(','),
  thresholds: {
    long: {
      viral: parseInt(process.env.VIRAL_VPH_LONG || '50000'),
      stable: parseInt(process.env.STABLE_VPH_LONG || '10000'),
    },
    short: {
      viral: parseInt(process.env.VIRAL_VPH_SHORT || '100000'),
      stable: parseInt(process.env.STABLE_VPH_SHORT || '25000'),
    },
  },
};
