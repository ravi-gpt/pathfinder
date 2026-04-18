import fetch from 'node-fetch';

async function testApi() {
    const profile = {
        name: "Test User",
        education: "B.Tech",
        collegeTier: "tier3",
        skills: ["Java", "SQL"],
        interests: ["Fintech"],
        fieldOfStudy: "CS",
        preferredWorkType: "any"
    };

    try {
        console.log("Calling /api/generate...");
        const res = await fetch('http://localhost:3001/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        if (data.youtubeVideoId) {
            console.log("Success! youtubeVideoId found:", data.youtubeVideoId);
        } else {
            console.warn("Failure: youtubeVideoId missing in response.");
            console.log("Response Keys:", Object.keys(data));
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testApi();
