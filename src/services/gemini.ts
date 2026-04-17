import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, CareerRecommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getCareerRecommendation(profile: UserProfile): Promise<CareerRecommendation> {
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

  const response = await ai.models.generateContent({
    model: "gemini-2.0-pro",
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

  return JSON.parse(response.text);
}

export async function getCareerChatResponse(
  message: string, 
  history: { role: 'user' | 'model', text: string }[],
  profile: UserProfile,
  recommendation: CareerRecommendation | null
): Promise<string> {
  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
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
      4. Avoid generic advice. Mention specific tools, libraries, or platforms related to their interests (${profile.interests.join(', ')}).
      5. Use Markdown (bolding, lists, code blocks) to make information digestible.
      
      Always address ${profile.name || 'Student'} warmly but maintain a high-performance mentorship tone.`,
    },
    history: history
  });

  const response = await chat.sendMessage({
    text: message
  });

  return response.text;
}
