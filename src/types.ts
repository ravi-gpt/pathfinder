export interface UserProfile {
  name: string;
  education: string;
  collegeTier: 'tier1' | 'tier2' | 'tier3';
  skills: string[];
  interests: string[];
  fieldOfStudy: string;
  preferredWorkType: 'remote' | 'on-site' | 'hybrid' | 'any';
}

export interface CareerRecommendation {
  role: string;
  description: string;
  suitabilityScore: number;
  suitabilityBreakdown: {
    skill: string;
    matchLevel: number; // 0-100
  }[];
  roadmap: {
    phase: string;
    description: string;
    milestones: string[];
  }[];
  resources: {
    title: string;
    type: 'course' | 'article' | 'project' | 'community' | 'search_result';
    link?: string;
    isFree: boolean;
    searchedSnippet?: string;
    sourceUrl?: string;
  }[];
  offCampusStrategy: string;
  gapAnalysis: {
    collegeCurriculum: string;
    industryRequirement: string;
    actionToBridge: string;
  }[];
  youtubeVideoId?: string;
}

export type AssessmentStep = 'intro' | 'profile' | 'skills' | 'interests' | 'results';
