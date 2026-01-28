/**
 * Test script to verify database connection
 * Usage: node scripts/test-database.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('💡 Make sure you have a .env file with DATABASE_URL set');
    process.exit(1);
  }

  console.log('🔍 Testing database connection...\n');

  const prisma = new PrismaClient();

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found in database');
      console.log('💡 Run: npm run db:push');
    } else {
      console.log('📊 Tables found:');
      tables.forEach((table) => {
        console.log(`   - ${table.table_name}`);
      });

      // Count records
      const videoCount = await prisma.video.count();
      const runCount = await prisma.collectorRun.count();
      const hitCount = await prisma.feedHit.count();

      console.log('\n📈 Record counts:');
      console.log(`   - Videos: ${videoCount}`);
      console.log(`   - Collector Runs: ${runCount}`);
      console.log(`   - Feed Hits: ${hitCount}`);

      if (videoCount === 0) {
        console.log('\n💡 No data yet. Run the collector to populate:');
        console.log('   curl -H "Authorization: Bearer YOUR_SECRET" \\');
        console.log('     http://localhost:3000/api/cron/collect-trending');
      }
    }

    console.log('\n🎉 Database is ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Authentication failed. Check your DATABASE_URL credentials.');
    } else if (error.message.includes('no pg_hba.conf entry')) {
      console.log('\n💡 Connection rejected. Check your database allows connections from this IP.');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection timeout. Check your network and database host.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
