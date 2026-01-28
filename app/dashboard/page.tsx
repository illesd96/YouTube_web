'use client';

import { useEffect, useState } from 'react';

interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  isShort: boolean;
  viewCount: string;
  viewsPerHour: number;
  bucket: string;
  nicheTags: string[];
  regionCode: string;
  seenAt: string;
}

interface Stats {
  last24h: {
    totalHits: number;
    uniqueVideos: number;
    byBucket: {
      viral: number;
      stable: number;
      low: number;
    };
    shorts: number;
    longForm: number;
  };
  lastRun: {
    runId: string;
    finishedAt: string;
    status: string;
  } | null;
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState('');
  const [collectSuccess, setCollectSuccess] = useState('');
  const [filter, setFilter] = useState({
    bucket: 'all',
    region: 'all',
    shorts: 'all',
    category: 'all',
    limit: 20,
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/stats/overview');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Build query params
      const params = new URLSearchParams({
        limit: filter.limit.toString(),
        hours: '24',
      });
      
      if (filter.bucket !== 'all') params.append('bucket', filter.bucket);
      if (filter.region !== 'all') params.append('region', filter.region);
      if (filter.shorts !== 'all') params.append('shorts', filter.shorts);
      if (filter.category !== 'all') params.append('category', filter.category);

      // Fetch videos
      const videosRes = await fetch(`/api/trending?${params}`);
      const videosData = await videosRes.json();
      setVideos(videosData.results || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCollection = async () => {
    const secret = prompt('Enter your CRON_SECRET to trigger collection:');
    if (!secret) return;

    setCollecting(true);
    setCollectError('');
    setCollectSuccess('');

    try {
      const response = await fetch('/api/cron/collect-trending', {
        headers: {
          'Authorization': `Bearer ${secret}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCollectSuccess(`Collection successful! Processed ${data.stats.totalVideosProcessed} videos.`);
        // Refresh data after 2 seconds
        setTimeout(() => {
          fetchData();
          setCollectSuccess('');
        }, 2000);
      } else {
        setCollectError(data.error || 'Collection failed. Check your CRON_SECRET.');
      }
    } catch (error) {
      setCollectError('Failed to trigger collection. Please try again.');
    } finally {
      setCollecting(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case 'viral': return 'bg-red-500';
      case 'stable': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getBucketEmoji = (bucket: string) => {
    switch (bucket) {
      case 'viral': return '🔥';
      case 'stable': return '📈';
      case 'low': return '📉';
      default: return '•';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">YouTube Trending Dashboard</h1>
            <p className="text-gray-400">Real-time trending video analytics</p>
          </div>
          <button
            onClick={triggerCollection}
            disabled={collecting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
          >
            {collecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Collecting...
              </>
            ) : (
              <>
                🔄 Collect Now
              </>
            )}
          </button>
        </div>

        {/* Collection Messages */}
        {collectSuccess && (
          <div className="mb-4 bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
            ✅ {collectSuccess}
          </div>
        )}
        {collectError && (
          <div className="mb-4 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            ❌ {collectError}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Videos (24h)</div>
              <div className="text-2xl font-bold">{stats.last24h.uniqueVideos.toLocaleString()}</div>
            </div>
            
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-300 text-sm mb-1">🔥 Viral</div>
              <div className="text-2xl font-bold">{stats.last24h.byBucket.viral.toLocaleString()}</div>
            </div>
            
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-yellow-300 text-sm mb-1">📈 Stable</div>
              <div className="text-2xl font-bold">{stats.last24h.byBucket.stable.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Shorts vs Long</div>
              <div className="text-2xl font-bold">
                {stats.last24h.shorts} / {stats.last24h.longForm}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Performance</label>
              <select
                value={filter.bucket}
                onChange={(e) => setFilter({ ...filter, bucket: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="all">All</option>
                <option value="viral">🔥 Viral</option>
                <option value="stable">📈 Stable</option>
                <option value="low">📉 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Region</label>
              <select
                value={filter.region}
                onChange={(e) => setFilter({ ...filter, region: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="all">All Regions</option>
                <option value="US">🇺🇸 United States</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="CH">🇨🇭 Switzerland</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Video Type</label>
              <select
                value={filter.shorts}
                onChange={(e) => setFilter({ ...filter, shorts: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="all">All Types</option>
                <option value="true">Shorts</option>
                <option value="false">Long-form</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="all">All Categories</option>
                <option value="1">Film & Animation</option>
                <option value="2">Autos & Vehicles</option>
                <option value="10">Music</option>
                <option value="15">Pets & Animals</option>
                <option value="17">Sports</option>
                <option value="19">Travel & Events</option>
                <option value="20">Gaming</option>
                <option value="22">People & Blogs</option>
                <option value="23">Comedy</option>
                <option value="24">Entertainment</option>
                <option value="25">News & Politics</option>
                <option value="26">Howto & Style</option>
                <option value="27">Education</option>
                <option value="28">Science & Technology</option>
                <option value="29">Nonprofits & Activism</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Results</label>
              <select
                value={filter.limit}
                onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="mt-4 text-gray-400">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-gray-400 mb-6">
              The collector hasn't run yet. Click "Collect Now" above to start collecting trending videos!
            </p>
            <button
              onClick={triggerCollection}
              disabled={collecting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-4 rounded-lg font-semibold transition text-lg"
            >
              {collecting ? 'Collecting...' : '🚀 Start First Collection'}
            </button>
            <p className="text-gray-500 text-sm mt-4">
              Or wait for the scheduled daily cron job
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.videoId} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <a
                    href={`https://youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded"
                    />
                  </a>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition"
                    >
                      <h3 className="font-semibold text-lg mb-1 truncate">{video.title}</h3>
                    </a>
                    <p className="text-gray-400 text-sm mb-2">{video.channelTitle}</p>
                    
                    <div className="flex flex-wrap gap-2 text-sm">
                      {/* Bucket Badge */}
                      <span className={`${getBucketColor(video.bucket)} px-2 py-1 rounded text-xs font-semibold`}>
                        {getBucketEmoji(video.bucket)} {video.bucket.toUpperCase()}
                      </span>

                      {/* Views Per Hour */}
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {formatNumber(Math.round(video.viewsPerHour))} views/hr
                      </span>

                      {/* Total Views */}
                      <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                        {formatNumber(parseInt(video.viewCount))} views
                      </span>

                      {/* Video Type */}
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                        {video.isShort ? '📱 Short' : '🎬 Long-form'}
                      </span>

                      {/* Region */}
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                        {video.regionCode}
                      </span>

                      {/* Time */}
                      <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                        {formatDate(video.seenAt)}
                      </span>
                    </div>

                    {/* Niches */}
                    {video.nicheTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {video.nicheTags.map((tag) => (
                          <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last Run Info */}
        {stats?.lastRun && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Last collection: {formatDate(stats.lastRun.finishedAt)} • 
            Status: <span className="text-green-400">{stats.lastRun.status}</span>
          </div>
        )}
      </div>
    </main>
  );
}
