import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, history, profile, recommendation } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const systemInstruction = `You are a concise PathFinder AI Assistant.
        
        User Profile: ${JSON.stringify(profile)}
        Current Path: ${recommendation ? recommendation.role : 'None yet'}
        
        YOUR ROLE: 
        1. Keep responses under 3 sentences to save tokens.
        2. Provide exact, actionable steps (e.g., "Spend 2 hours on X").
        3. Mention specific tools related to interests: (${profile.interests?.join(', ') || 'general technology'}).
        4. Do NOT output long generic advice. Provide simulated actionable internet search links.
        5. Use simple Markdown. Address user warmly.`;

    let resultText = "";

    // Timeout helper to avoid waiting forever for sluggish APIs
    const fetchWithTimeout = (promise: Promise<any>, timeoutMs: number) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout hit')), timeoutMs))
        ]);
    };

    try {
        console.log("Attempting chat with Gemini...");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const chat = ai.chats.create({
            model: "gemini-flash-lite-latest",
            config: {
                systemInstruction: systemInstruction,
            },
            history: history
        });

        // Increase Gemini timeout to 10s for better chat reliability
        const response: any = await fetchWithTimeout(chat.sendMessage(message), 10000);
        resultText = response.text || "";
        console.log("Successfully generated chat response with Gemini.");
    } catch (geminiError: any) {
        console.error("Gemini Chat Error, attempting OpenRouter fallback...", geminiError.message);

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'Gemini failed and no OpenRouter API key found for fallback.' });
        }

        const modelsToTry = [
            "google/gemini-2.0-flash-lite-preview-02-05:free", // Super fast
            "google/gemma-4-31b-it:free",                     // Fast
            "moonshotai/kimi-k2.5",                            // Good fallback
            "nvidia/nemotron-3-super-120b-a12b:free"          // Last resort
        ];

        let success = false;
        let lastError = null;

        for (const model of modelsToTry) {
            try {
                console.log(`Trying OpenRouter model: ${model}`);
                // Map history format: { role: 'user' | 'model', text: string } -> { role: 'user' | 'assistant', content: string }
                const mappedHistory = (history || []).map((h: any) => ({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.text
                }));

                const messages = [
                    { role: "system", content: systemInstruction },
                    ...mappedHistory,
                    { role: "user", content: message }
                ];

                const orResponse: any = await fetchWithTimeout(fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages
                    })
                }), 8000); // 8s timeout for chat so it falls through quickly

                if (!orResponse.ok) {
                    const errText = await orResponse.text();
                    throw new Error(`Status ${orResponse.status}: ${errText}`);
                }

                const data = await orResponse.json();
                const content = data.choices[0]?.message?.content;

                if (!content) throw new Error("Invalid response structure");
                
                resultText = content;
                console.log(`Successfully generated chat response with OpenRouter (${model}).`);
                success = true;
                break;
            } catch (orError: any) {
                console.warn(`OpenRouter model ${model} failed for chat:`, orError.message);
                lastError = orError;
            }
        }

        if (!success) {
            return res.status(500).json({ error: `Both Gemini and OpenRouter failed. Last error: ${lastError?.message}` });
        }
    }

    return res.status(200).json({ text: resultText });
}
