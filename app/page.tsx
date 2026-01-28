import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">
            YouTube Trending Collector
          </h1>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            View Dashboard →
          </Link>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <p className="text-gray-300 mb-4">
            Automatically collects YouTube trending videos every 6 hours from
            top global markets.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded p-4">
              <div className="text-sm text-gray-400">Target Markets</div>
              <div className="text-lg font-semibold">6 Regions</div>
              <div className="text-xs text-gray-500">US, CA, GB, AU, DE, CH</div>
            </div>
            
            <div className="bg-gray-700 rounded p-4">
              <div className="text-sm text-gray-400">Collection Schedule</div>
              <div className="text-lg font-semibold">Daily</div>
              <div className="text-xs text-gray-500">Vercel Cron (6h with Pro)</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Available APIs</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="font-mono text-sm text-blue-400">
                GET /api/trending
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Query trending videos with filters (region, niche, bucket, time window)
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Params: region, niche, bucket, shorts, hours, limit, offset
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="font-mono text-sm text-green-400">
                GET /api/stats/overview
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Get aggregated statistics for last 24h and 7d
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <div className="font-mono text-sm text-purple-400">
                GET /api/video/[id]
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Get detailed video information and appearance history
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <div className="font-mono text-sm text-red-400">
                GET /api/cron/collect-trending
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Trigger collection manually (requires CRON_SECRET)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span>Idempotent storage - one global record per video</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span>Automatic classification: Shorts vs Long-form</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span>Performance bucketing: Viral / Stable / Low</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span>19 custom niche categories with keyword matching</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span>Tracks video appearances across regions and categories</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span>Views-per-hour performance metrics</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
