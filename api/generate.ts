import { GoogleGenAI, Type } from "@google/genai";

// Ensure structured output from OpenRouter by adding formatting instructions
const getOpenRouterPayload = (prompt: string, schemaInstruction: string) => ({
    model: process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free",
    messages: [
        {
            role: "system",
            content: "You are an expert career counselor AI. Your task is to output strictly valid JSON matching the requested schema. Do not include markdown formatting like ```json or any other text before or after the JSON."
        },
        {
            role: "user",
            content: `${prompt}\n\n${schemaInstruction}`
        }
    ],
    response_format: { type: "json_object" }
});

export default async function handler(req: any, res: any) {
    console.log(`[API] Received request for: ${req.body?.profile?.name || 'Unknown'}`);
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { profile } = req.body;

    if (!profile) {
        return res.status(400).json({ error: 'Profile is required' });
    }

    const prompt = `Based on the following student profile, provide a highly personalized career recommendation, localized for the context of a Tier ${profile.collegeTier.replace('tier', '')} college student. 
  
  Student Profile:
  - Name: ${profile.name}
  - Education: ${profile.education} (${profile.fieldOfStudy})
  - College Tier: ${profile.collegeTier}
  - Skills: ${profile.skills.join(', ')}
  - Interests: ${profile.interests.join(', ')}
  - Preferred Work: ${profile.preferredWorkType}

  Focus on:
  1. Bridging the gap (Tier 2/3 to top-tier).
  2. Niche role match.
  3. 12-month roadmap (limit to 3 phases max).
  4. Off-campus hacks.
  5. 3 concise curated resources with simulated 'Search' (searchedSnippets, sourceUrls).
  
  CRITICAL constraints to save data:
  - Keep all descriptions under 2 sentences.
  - Limit roadmap milestones to 3 per phase.
  - Limit resources to 3 total.
  - Be extremely concise.
  
  Provide response in structured JSON format.`;

    const schemaDefinition = {
        type: Type.OBJECT,
        required: ["role", "description", "suitabilityScore", "suitabilityBreakdown", "roadmap", "resources", "offCampusStrategy", "gapAnalysis"],
        properties: {
            role: { type: Type.STRING },
            description: { type: Type.STRING },
            suitabilityScore: { type: Type.NUMBER },
            suitabilityBreakdown: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    required: ["skill", "matchLevel"],
                    properties: {
                        skill: { type: Type.STRING },
                        matchLevel: { type: Type.NUMBER }
                    }
                }
            },
            roadmap: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    required: ["phase", "description", "milestones"],
                    properties: {
                        phase: { type: Type.STRING },
                        description: { type: Type.STRING },
                        milestones: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            },
            resources: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    required: ["title", "type", "isFree", "searchedSnippet", "sourceUrl"],
                    properties: {
                        title: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["course", "article", "project", "community", "search_result"] },
                        link: { type: Type.STRING },
                        isFree: { type: Type.BOOLEAN },
                        searchedSnippet: { type: Type.STRING },
                        sourceUrl: { type: Type.STRING }
                    }
                }
            },
            offCampusStrategy: { type: Type.STRING },
            gapAnalysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    required: ["collegeCurriculum", "industryRequirement", "actionToBridge"],
                    properties: {
                        collegeCurriculum: { type: Type.STRING },
                        industryRequirement: { type: Type.STRING },
                        actionToBridge: { type: Type.STRING }
                    }
                }
            }
        }
    };

    let resultJson = null;

    // Timeout helper to avoid waiting forever for sluggish APIs
    const fetchWithTimeout = (promise: Promise<any>, timeoutMs: number) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout hit')), timeoutMs))
        ]);
    };

    try {
        console.log("Attempting to generate content with Gemini...");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
        // Increase timeout slightly to 12s for better reliability on high-demand spikes
        const response: any = await fetchWithTimeout(ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schemaDefinition
            }
        }), 12000);
        
        resultJson = JSON.parse(response.text);
        console.log("Successfully generated content with Gemini.");
    } catch (geminiError: any) {
        console.error("Gemini API skipped/failed, falling back to OpenRouter...", geminiError.message);
        
        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'Gemini failed and no OpenRouter API key found for fallback.' });
        }

        const modelsToTry = [
            "google/gemini-2.0-flash-lite-preview-02-05:free", // Super fast
            "google/gemma-4-31b-it:free",                     // Fast
            "moonshotai/kimi-k2.5",                            // Good fallback
            "nvidia/nemotron-3-super-120b-a12b:free"          // Last resort (slow)
        ];

        let success = false;
        let lastError = null;

        for (const model of modelsToTry) {
            try {
                console.log(`Trying OpenRouter model: ${model}`);
                const schemaString = `Ensure the output specifically matches this JSON structure, where 'resources' must include 'searchedSnippet' and 'sourceUrl': ${JSON.stringify(schemaDefinition)}`;
                
                // Allow fast 12s timeout per OpenRouter attempt to keep things speedy
                const orResponse: any = await fetchWithTimeout(fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert career counselor AI. Your task is to output strictly valid JSON matching the requested schema. Do not include markdown formatting like ```json or any other text before or after the JSON."
                            },
                            {
                                role: "user",
                                content: `${prompt}\n\n${schemaString}`
                            }
                        ],
                        response_format: { type: "json_object" }
                    })
                }), 12000);

                if (!orResponse.ok) {
                    const errText = await orResponse.text();
                    throw new Error(`Status ${orResponse.status}: ${errText}`);
                }

                const data = await orResponse.json();
                const content = data.choices[0]?.message?.content;
                
                if (!content) throw new Error("Invalid response structure");
                
                const cleanedContent = content.replace(/^```json/g, '').replace(/```$/g, '').trim();
                resultJson = JSON.parse(cleanedContent);
                console.log(`Successfully generated content with OpenRouter Fallback (${model}).`);
                success = true;
                break; // Break loop on success
            } catch (orError: any) {
                console.warn(`OpenRouter model ${model} failed:`, orError.message);
                lastError = orError;
            }
        }
    }

    if (!resultJson) {
        return res.status(500).json({ error: "Failed to generate roadmap data." });
    }

    // Add YouTube Integration
    try {
        const youtubeApiKey = process.env.YOUTUBE_API_KEY;
        if (youtubeApiKey) {
            console.log(`[YouTube] Searching for: ${resultJson.role} career roadmap masterclass`);
            const ytResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(resultJson.role + " career roadmap masterclass")}&type=video&videoEmbeddable=true&order=relevance&key=${youtubeApiKey}`
            );
            
            if (ytResponse.ok) {
                const ytData = await ytResponse.json();
                if (ytData.items && ytData.items.length > 0) {
                    resultJson.youtubeVideoId = ytData.items[0].id.videoId;
                    console.log(`[YouTube] Success! Video ID: ${resultJson.youtubeVideoId}`);
                } else {
                    console.warn(`[YouTube] No videos found for: ${resultJson.role}`);
                    // Try a broader search as fallback
                    console.log(`[YouTube] Retrying with broader search...`);
                    const fallbackResponse = await fetch(
                        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(resultJson.role)}&type=video&videoEmbeddable=true&key=${youtubeApiKey}`
                    );
                    if (fallbackResponse.ok) {
                        const fbData = await fallbackResponse.json();
                        if (fbData.items && fbData.items.length > 0) {
                            resultJson.youtubeVideoId = fbData.items[0].id.videoId;
                            console.log(`[YouTube] Fallback Success! Video ID: ${resultJson.youtubeVideoId}`);
                        }
                    }
                }
            } else {
                const errDetail = await ytResponse.text();
                console.error(`[YouTube] API Error: ${ytResponse.status} - ${errDetail}`);
            }
        } else {
            console.error("[YouTube] API Key missing in environment!");
        }
    } catch (ytError) {
        console.error("[YouTube] Critical fetch failure:", ytError);
    }

    console.log(`[API] Returning response for: ${resultJson.role} with Video ID: ${resultJson.youtubeVideoId || 'None'}`);
    return res.status(200).json(resultJson);
}
