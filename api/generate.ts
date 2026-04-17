import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { profile } = req.body;

    if (!profile) {
        return res.status(400).json({ error: 'Profile is required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `Based on the following student profile, provide a highly personalized career recommendation, localized for the context of a Tier ${profile.collegeTier.replace('tier', '')} college student. 
  
  Student Profile:
  - Name: ${profile.name}
  - Education: ${profile.education} (${profile.fieldOfStudy})
  - College Tier: ${profile.collegeTier}
  - Skills: ${profile.skills.join(', ')}
  - Interests: ${profile.interests.join(', ')}
  - Preferred Work: ${profile.preferredWorkType}

  Focus on:
  1. Bridging the gap between tier 2/3 education and top-tier job requirements.
  2. Niche roles that match their current skills and interests.
  3. A step-by-step roadmap for the next 12 months.
  4. Specific off-campus placement strategies (Open Source, Networking, Portfolio, Hackathons).
  5. Curated resources.
  
  Please provide the response in a structured JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
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
                                required: ["title", "type", "isFree"],
                                properties: {
                                    title: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ["course", "article", "project", "community"] },
                                    link: { type: Type.STRING },
                                    isFree: { type: Type.BOOLEAN }
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
                }
            }
        });

        return res.status(200).json(JSON.parse(response.text));
    } catch (error: any) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
