# YouTube Trending Collector – Module 1 (Developer Specification)

## 1. Purpose

Build a web application (Next.js on Vercel) that automatically collects **YouTube most‑popular videos** every 6 hours from the **top-paying global markets**, stores them **idempotently** (one global copy per video), classifies them by **Shorts vs Long‑form**, assigns **custom niches**, and buckets them by **performance potential**.

This module is the foundation for a larger system that will later include creator dashboards and AI-driven content automation.

---

## 2. Target Markets (Regions)

Default regions (configurable):

- US – United States
- CA – Canada
- GB – United Kingdom
- AU – Australia
- DE – Germany
- CH – Switzerland

These regions represent the strongest RPM / advertiser demand globally.

---

## 3. Collection Strategy

### Schedule

- Automated execution **every 6 hours**
- Implemented using **Vercel Cron**

Cron expression (UTC):
```
0 */6 * * *
```

### Data Source

- YouTube Data API v3
- Endpoint: `videos.list`
- Mode: `chart=mostPopular`
- Scope: per region × per YouTube category

No "last 24h" search approximation is used in v1 (keeps quota low and stability high).

---

## 4. Video Types: Shorts vs Long‑form

YouTube does not expose a reliable `isShort` flag for arbitrary videos via the API.

**v1 heuristic (recommended):**

- Parse `contentDetails.duration` (ISO‑8601)
- Convert to seconds
- `is_short = duration_seconds <= 60`

This works well for the majority of Shorts and is deterministic.

---

## 5. Performance Bucketing (Views‑Per‑Hour Model)

Each video appearance is classified into **one of three buckets**:

- **Viral**
- **Stable**
- **Low**

### Metric

```
age_hours = max(1, hours_since_publish)
views_per_hour = view_count / age_hours
```

### Thresholds (Configurable Defaults)

#### Long‑form
- Viral: `>= 50,000 vph`
- Stable: `10,000 – 49,999 vph`
- Low: `< 10,000 vph`

#### Shorts
- Viral: `>= 100,000 vph`
- Stable: `25,000 – 99,999 vph`
- Low: `< 25,000 vph`

Store both `views_per_hour` and `bucket` for later tuning.

---

## 6. Data Model (PostgreSQL)

### videos (global, idempotent)

- `video_id` (PK)
- `title`
- `channel_id`
- `channel_title`
- `published_at`
- `duration_seconds`
- `is_short`
- `thumbnail_url`
- Snapshot metrics:
  - `view_count`
  - `like_count`
  - `comment_count`
- `first_seen_at`
- `last_seen_at`

### collector_runs

- `run_id` (UUID, PK)
- `started_at`
- `finished_at`
- `status` (`running | ok | error`)
- `error` (nullable)

### feed_hits (appearance tracking)

Tracks *when and where* a video appears.

- `id` (PK)
- `run_id` (FK)
- `video_id` (FK)
- `region_code`
- `category_id` (YouTube category)
- `seen_at`
- `views_per_hour`
- `bucket` (`viral | stable | low`)
- `niche_tags` (array / JSONB)

**Unique constraint:**

```
(video_id, region_code, category_id, date(seen_at))
```

Guarantees no duplicates per day per feed slot.

---

## 7. Idempotency Rules

- Always **UPSERT** into `videos` by `video_id`
- On conflict:
  - Update metrics and `last_seen_at`
- Insert into `feed_hits`
  - Ignore conflicts via unique constraint

Result: one canonical video record, many tracked appearances.

---

## 8. Niche Classification (Keyword‑Based v1)

### Matching Rules

- Input text: `title + channel_title`
- Normalize:
  - lowercase
  - strip punctuation
- OR‑based keyword matching
- Videos may have **multiple niches**

### Niche Keyword Sets

#### Luxury Houses / Real Estate
- luxury home, luxury house, mansion, villa, penthouse, estate tour, house tour, property tour, architectural digest, real estate, dream home, modern house, interior design, architecture tour

#### Engineering
- engineering, mechanical, electrical, civil engineering, structural, cad, solidworks, autocad, robotics, cnc, manufacturing, aerospace, automation, control systems, thermodynamics

#### Pets
- dog, puppy, cat, kitten, pet, pets, training, vet, grooming, rescue, hamster, parrot, aquarium

#### Court / Law
- court, trial, judge, lawsuit, legal, attorney, lawyer, prosecutor, verdict, sentencing, supreme court

#### Luxury (General)
- luxury, premium, high end, exclusive, bespoke, limited edition, collector

#### Luxury Women Clothing & Accessories
- chanel, hermes, dior, louis vuitton, lv, gucci, prada, ysl, balenciaga, fendi, burberry
- handbag, purse, heels, jewelry, accessories, luxury fashion, unboxing

#### Stock Market / Investing
- stock, stocks, options, earnings, nasdaq, nyse, sp500, etf, investing, trading, technical analysis, dividends

#### Business
- business, entrepreneur, startup, founder, saas, marketing, sales, strategy, leadership, side hustle

#### Travel
- travel, trip, guide, hotel, resort, itinerary, vlog, city tour, luxury travel

#### Automobiles
- car, automotive, test drive, review, supercar, hypercar, suv, sedan

#### Electric Vehicles
- ev, electric vehicle, tesla, rivian, lucid, charging, battery, range test

#### Website / SaaS Reviews
- website review, ux, ui, landing page, audit, figma, webflow, shopify, wordpress

#### Make Money Online
- make money online, mmo, affiliate, dropshipping, amazon fba, freelancing, passive income

#### Yachts
- yacht, superyacht, mega yacht, catamaran, sailing yacht, marina

#### Tech
- tech, gadgets, smartphone, laptop, cpu, gpu, ai, chatgpt, programming, software

#### Economy / Macro
- inflation, interest rates, fed, ecb, recession, gdp, bonds, oil price, forex

#### History
- history, ancient, medieval, ww2, roman, egypt, documentary

#### Football (Soccer)
- football, soccer, premier league, champions league, la liga, bundesliga, world cup

#### High‑Paying Meta Tags
- finance, mortgage, insurance, tax, cloud, aws, azure, cybersecurity, real estate, legal, luxury

---

## 9. Application Architecture

### Stack

- Next.js (App Router)
- Vercel Cron
- PostgreSQL (Neon / Supabase / managed)
- ORM: Prisma or Drizzle

### Environment Variables

- `YOUTUBE_API_KEY`
- `DATABASE_URL`
- `CRON_SECRET`
- `REGIONS=US,CA,GB,AU,DE,CH`

Optional tuning:
- `VIRAL_VPH_LONG`
- `STABLE_VPH_LONG`
- `VIRAL_VPH_SHORT`
- `STABLE_VPH_SHORT`

---

## 10. Cron Endpoint

**Route:**
```
GET /api/cron/collect-trending
```

**Security:**
- Require header `Authorization: Bearer <CRON_SECRET>`

**Flow:**
1. Create `collector_runs` record
2. Load cached YouTube categories (refresh daily)
3. Loop regions × categories
4. Call `videos.list`
5. Normalize + classify + upsert
6. Insert feed hits
7. Mark run status

---

## 11. Dashboard API (Read‑Only)

- `GET /api/trending`
  - filters: region, niche, bucket, shorts, time window
- `GET /api/stats/overview`
  - aggregated counts (24h / 7d)
- `GET /api/video/{id}`
  - video details + appearance history

---

## 12. Notes for Implementation

- Cache YouTube category lists per region (daily)
- Implement rate‑limit backoff (403 / 429)
- Keep raw API payloads optionally for debugging
- Design niches as config so they can evolve

---

## 13. Future Extensions (Out of Scope)

- YouTube Analytics API (your channel performance)
- AI‑based niche classification
- Trend velocity across runs
- Content idea scoring & script generation

---

**This document is intended to be directly usable by a developer to implement Module 1 end‑to‑end.**

