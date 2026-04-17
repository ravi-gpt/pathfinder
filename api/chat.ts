import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, history, profile, recommendation } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    try {
        const chat = ai.chats.create({
            model: "gemini-flash-lite-latest",
            config: {
                systemInstruction: `You are PathFinder AI Assistant, an elite career mentor specialized in Tier 2/3 engineering success.
        
        User Profile: ${JSON.stringify(profile)}
        Current Path: ${recommendation ? recommendation.role : 'None yet'}
        Current Roadmap: ${recommendation ? JSON.stringify(recommendation.roadmap) : 'No roadmap yet'}

        CONTEXT: The user is asking for personalized step-by-step suggestions.
        
        YOUR ROLE: 
        1. Provide extremely granular, actionable steps (e.g., "This week, spend 2 hours on X", "Finish this specific module on Y").
        2. If a roadmap exists, break down the CURRENT phase into weekly or daily tasks.
        3. Focus on "Off-Campus" hacks: LinkedIn cold outreach templates, portfolio tips, and niche communities.
        4. Avoid generic advice. Mention specific tools, libraries, or platforms related to their interests (${profile.interests?.join(', ') || 'general technology'}).
        5. Use Markdown (bolding, lists, code blocks) to make information digestible.
        
        Always address ${profile.name || 'Student'} warmly but maintain a high-performance mentorship tone.`,
            },
            history: history
        });

        const response = await chat.sendMessage(message);

        return res.status(200).json({ text: response.text });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
