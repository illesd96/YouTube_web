-- YouTube Trending Collector Database Schema
-- Run this SQL in your Neon database console

-- Table: videos (global video registry)
CREATE TABLE IF NOT EXISTS videos (
    video_id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    channel_title VARCHAR(255) NOT NULL,
    published_at TIMESTAMP NOT NULL,
    duration_seconds INTEGER NOT NULL,
    is_short BOOLEAN NOT NULL,
    thumbnail_url TEXT NOT NULL,
    view_count BIGINT NOT NULL,
    like_count BIGINT,
    comment_count BIGINT,
    first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: collector_runs (execution tracking)
CREATE TABLE IF NOT EXISTS collector_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    error TEXT
);

-- Table: feed_hits (appearance tracking)
CREATE TABLE IF NOT EXISTS feed_hits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    video_id VARCHAR(255) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    views_per_hour DOUBLE PRECISION NOT NULL,
    bucket VARCHAR(50) NOT NULL,
    niche_tags TEXT[] NOT NULL DEFAULT '{}',
    
    CONSTRAINT fk_run FOREIGN KEY (run_id) REFERENCES collector_runs(run_id) ON DELETE CASCADE,
    CONSTRAINT fk_video FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
);

-- Indexes for feed_hits (for faster queries)
CREATE INDEX IF NOT EXISTS idx_feed_hits_region ON feed_hits(region_code);
CREATE INDEX IF NOT EXISTS idx_feed_hits_bucket ON feed_hits(bucket);
CREATE INDEX IF NOT EXISTS idx_feed_hits_seen_at ON feed_hits(seen_at);
CREATE INDEX IF NOT EXISTS idx_feed_hits_video_region_category_seen ON feed_hits(video_id, region_code, category_id, seen_at);
CREATE INDEX IF NOT EXISTS idx_feed_hits_niche_tags ON feed_hits USING GIN(niche_tags);

-- Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('videos', 'collector_runs', 'feed_hits')
ORDER BY table_name;
