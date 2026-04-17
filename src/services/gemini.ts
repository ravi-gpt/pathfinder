import { UserProfile, CareerRecommendation } from "../types";

export async function getCareerRecommendation(profile: UserProfile): Promise<CareerRecommendation> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to generate recommendation');
  }

  return response.json();
}

export async function getCareerChatResponse(
  message: string,
  history: { role: 'user' | 'model', text: string }[],
  profile: UserProfile,
  recommendation: CareerRecommendation | null
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history, profile, recommendation }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to get chat response');
  }

  const data = await response.json();
  return data.text;
}
