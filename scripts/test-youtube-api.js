/**
 * Test script to verify YouTube API key is working
 * Usage: node scripts/test-youtube-api.js
 */

require('dotenv').config();

async function testYouTubeAPI() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('❌ YOUTUBE_API_KEY not found in environment variables');
    console.log('💡 Make sure you have a .env file with YOUTUBE_API_KEY set');
    process.exit(1);
  }

  console.log('🔍 Testing YouTube API key...\n');

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&maxResults=5&key=${apiKey}`
    );

    const data = await response.json();

    if (response.ok && data.items && data.items.length > 0) {
      console.log('✅ YouTube API key is valid!\n');
      console.log('📊 Sample data:');
      console.log(`   - Retrieved ${data.items.length} videos`);
      console.log(`   - First video: "${data.items[0].snippet.title}"`);
      console.log(`   - Channel: ${data.items[0].snippet.channelTitle}\n`);
      console.log('🎉 You\'re ready to collect trending videos!');
      process.exit(0);
    } else {
      console.error('❌ API request failed:');
      console.error(JSON.stringify(data.error, null, 2));
      
      if (data.error?.message?.includes('API key not valid')) {
        console.log('\n💡 Your API key is invalid. Please check:');
        console.log('   1. Key is correct in .env file');
        console.log('   2. YouTube Data API v3 is enabled in Google Cloud Console');
        console.log('   3. API key restrictions allow YouTube Data API v3');
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    process.exit(1);
  }
}

testYouTubeAPI();
