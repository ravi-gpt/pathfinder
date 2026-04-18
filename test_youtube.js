import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function testYoutube() {
    const key = process.env.YOUTUBE_API_KEY;
    const query = "Software Engineer career roadmap masterclass";
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&order=relevance&key=${key}`;
    
    console.log(`Testing URL: ${url}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testYoutube();
