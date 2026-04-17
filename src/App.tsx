/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Target, 
  BookOpen, 
  Users, 
  Briefcase,
  CheckCircle2,
  Brain,
  Rocket,
  ArrowRight,
  Loader2,
  ExternalLink,
  Map,
  Lightbulb,
  Bot,
  X
} from 'lucide-react';
import { UserProfile, CareerRecommendation, AssessmentStep } from './types';
import { getCareerRecommendation } from './services/gemini';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import AIChatAssistant from './components/AIChatAssistant';

export default function App() {
  const [step, setStep] = useState<AssessmentStep>('intro');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    education: '',
    collegeTier: 'tier3',
    skills: [],
    interests: [],
    fieldOfStudy: '',
    preferredWorkType: 'any'
  });
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<CareerRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});

  const initialSkills = ['Java', 'Python', 'Go', 'Rust', 'C++', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Next.js', 'Node.js', 'Django', 'FastAPI', 'Spring Boot', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform', 'CI/CD', 'Data Analytics', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'UI/UX Design', 'Figma', 'Product Management', 'Cybersecurity', 'Web Development', 'Mobile App Development', 'Flutter', 'React Native'];
  const initialInterests = ['Fintech', 'EdTech', 'HealthTech', 'AgriTech', 'Climate Tech', 'AI & Machine Learning', 'Web3 & Blockchain', 'Gaming & Metaverse', 'DevOps & Infrastructure', 'E-commerce', 'SaaS', 'High-Frequency Trading', 'Open Source Contribution', 'Competitive Programming', 'Building Micro-SaaS', 'Freelancing', 'Government Tech'];

  const progress = useMemo(() => {
    switch (step) {
      case 'intro': return 0;
      case 'profile': return 33;
      case 'skills': return 66;
      case 'interests': return 90;
      case 'results': return 100;
      default: return 0;
    }
  }, [step]);

  const handleNext = () => {
    if (step === 'intro') setStep('profile');
    else if (step === 'profile') setStep('skills');
    else if (step === 'skills') setStep('interests');
    else if (step === 'interests') getRecommendation();
  };

  const handleBack = () => {
    if (step === 'profile') setStep('intro');
    else if (step === 'skills') setStep('profile');
    else if (step === 'interests') setStep('skills');
    else if (step === 'results') setStep('interests');
  };

  const toggleSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    setCompletedMilestones({}); // Reset progress on new recommendation
    try {
      const rec = await getCareerRecommendation(profile);
      setRecommendation(rec);
      setStep('results');
      // Scroll to top when results are shown
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("PathFinder Error:", err);
      setError("AI failed to generate a roadmap. This usually happens due to network issues. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = (phaseIndex: number, milestoneIndex: number) => {
    const key = `${phaseIndex}-${milestoneIndex}`;
    setCompletedMilestones(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getPhaseProgress = (phaseIndex: number, milestones: string[]) => {
    const completedCount = milestones.filter((_, i) => completedMilestones[`${phaseIndex}-${i}`]).length;
    return (completedCount / milestones.length) * 100;
  };

  const isPhaseCompleted = (phaseIndex: number, milestones: string[]) => {
    return milestones.every((_, i) => completedMilestones[`${phaseIndex}-${i}`]);
  };

  const isPhaseAccessible = (phaseIndex: number) => {
    if (phaseIndex === 0) return true;
    return isPhaseCompleted(phaseIndex - 1, recommendation?.roadmap[phaseIndex - 1].milestones || []);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">PathFinder<span className="text-blue-600">AI</span></span>
          </div>
          {step !== 'intro' && (
            <div className="hidden sm:block w-64 bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-blue-600 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-12 py-12"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100"
                >
                  <Sparkles className="w-4 h-4 text-blue-500 fill-blue-500" />
                  Elevate Your Career Path
                </motion.div>
                <h1 className="text-5xl sm:text-8xl font-black tracking-tighter leading-none">
                  Find Your <br />
                  <span className="gradient-text">North Star</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                  The personalized career recommendation engine for the next generation of engineers, specifically optimized for Tier 2/3 college students.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button 
                  onClick={handleNext}
                  className="group px-10 py-5 bg-slate-900 text-white rounded-full font-bold text-lg flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10"
                >
                  Start My Journey
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img 
                      key={i}
                      src={`https://picsum.photos/seed/${i + 100}/100/100`}
                      className="w-12 h-12 rounded-full border-4 border-white shadow-sm"
                      referrerPolicy="no-referrer"
                      alt="User"
                    />
                  ))}
                  <div className="w-12 h-12 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                    +5k
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
                {[
                  { icon: Target, title: "Custom Roadmaps", desc: "Actionable month-by-month steps tailored to your goals." },
                  { icon: Brain, title: "AI Intelligence", desc: "Powered by Gemini for deep career context and expertise." },
                  { icon: Rocket, title: "Off-campus Focus", desc: "Specialized strategies to win from Tier 2/3 colleges." }
                ].map((feature, i) => (
                  <div key={i} className="p-8 bg-white rounded-3xl border border-slate-200 text-left space-y-4 hover:shadow-xl hover:shadow-slate-200 transition-all group">
                    <div className="p-3 bg-slate-50 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xl">{feature.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div 
              key="profile"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight">The Basics</h2>
                <p className="text-lg text-slate-500">Tell us a bit about your current background.</p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({...prev, name: e.target.value}))}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-hidden transition-all text-lg font-medium"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Course / Major</label>
                    <input 
                      type="text" 
                      value={profile.fieldOfStudy}
                      onChange={(e) => setProfile(prev => ({...prev, fieldOfStudy: e.target.value}))}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-hidden transition-all text-lg font-medium"
                      placeholder="e.g. B.Tech Computer Science"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">College Profile</label>
                    <select 
                      value={profile.collegeTier}
                      onChange={(e) => setProfile(prev => ({...prev, collegeTier: e.target.value as any}))}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-hidden transition-all bg-white text-lg font-medium"
                    >
                      <option value="tier1">Tier 1 (IIT/NIT/BITS/Top Pvt)</option>
                      <option value="tier2">Tier 2 (Good Regional/Reputed)</option>
                      <option value="tier3">Tier 3 (Local/Average Colleges)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-10">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest text-xs">
                  <ChevronLeft className="w-5 h-5" /> Back to start
                </button>
                <button 
                  disabled={!profile.name || !profile.fieldOfStudy}
                  onClick={handleNext} 
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 'skills' && (
            <motion.div 
              key="skills"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Your Toolkit</h2>
                <p className="text-slate-500">Select the skills you already possess or are learning.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {initialSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium",
                      profile.skills.includes(skill)
                        ? "bg-blue-600 border-blue-600 text-white scale-105"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-400"
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  disabled={profile.skills.length < 2}
                  onClick={handleNext} 
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 'interests' && (
            <motion.div 
              key="interests"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">What Excites You?</h2>
                <p className="text-slate-500">Career happiness depends on passion. Select your interests.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {initialInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium",
                      profile.interests.includes(interest)
                        ? "bg-emerald-600 border-emerald-600 text-white scale-105"
                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400"
                    )}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                  <X className="w-5 h-5" /> {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-6">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  disabled={profile.interests.length < 1 || loading}
                  onClick={handleNext} 
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : "Generate Roadmap"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'results' && recommendation && (
            <motion.div 
              key="results"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-12"
            >
              {/* Header result */}
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  <Rocket className="w-4 h-4" /> Recommended Career Path
                </div>
                <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight underline decoration-blue-500/30 underline-offset-8">{recommendation.role}</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-6">
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                        <motion.circle 
                          cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 40}
                          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                          animate={{ strokeDashoffset: (2 * Math.PI * 40) * (1 - recommendation.suitabilityScore / 100) }}
                          className="text-emerald-500"
                        />
                      </svg>
                      <span className="absolute text-xl font-black text-slate-900">{recommendation.suitabilityScore}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Overall Match</span>
                  </div>
                  <div className="text-left max-w-lg">
                    <p className="text-slate-600 text-lg leading-relaxed font-medium">"{recommendation.description}"</p>
                  </div>
                </div>
              </div>

              {/* Suitability Breakdown - UNIQUE FEATURE 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-bold">Skill Suitability Radar</h3>
                  </div>
                  <div className="space-y-4">
                    {recommendation.suitabilityBreakdown.map((item, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-tight text-slate-500">
                          <span>{item.skill}</span>
                          <span>{item.matchLevel}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.matchLevel}%` }}
                            className="h-full bg-blue-600 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-600 text-white p-8 rounded-3xl space-y-6 shadow-xl shadow-blue-600/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-xl font-bold italic">Career Insight</h3>
                  </div>
                  <p className="text-blue-50 font-medium leading-relaxed">
                    Based on your Tier {profile.collegeTier.replace('tier', '')} background, we've identified that your strongest leverage is in **{recommendation.suitabilityBreakdown[0]?.skill}**. 
                    Our roadmap focuses on converting this academic knowledge into high-value industry projects.
                  </p>
                  <button 
                    onClick={() => {
                      const btn = document.querySelector('[data-assistant-toggle]') as HTMLButtonElement;
                      if (btn) btn.click();
                    }}
                    className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    Discuss This Insight
                  </button>
                </div>
              </div>

              {/* The Bridge Analysis - UNIQUE FEATURE 2 */}
              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 rounded-xl">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">The Bridge: College vs. Industry</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {recommendation.gapAnalysis.map((item, i) => (
                    <div key={i} className="group grid grid-cols-1 md:grid-cols-3 bg-white rounded-3xl border border-slate-200 overflow-hidden hover:border-blue-500 transition-all">
                      <div className="p-6 bg-slate-50 border-r border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">In College</span>
                        <p className="text-sm font-bold text-slate-700">{item.collegeCurriculum}</p>
                      </div>
                      <div className="p-6 bg-white">
                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest block mb-1">Industry Wants</span>
                        <p className="text-sm font-bold text-slate-900">{item.industryRequirement}</p>
                      </div>
                      <div className="p-6 bg-blue-50 flex items-center gap-3">
                        <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest block mb-1">Your Action</span>
                          <p className="text-xs font-bold text-blue-900">{item.actionToBridge}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roadmap Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold">Guided Roadmap</h3>
                  </div>
                  {recommendation && (
                    <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Progress</p>
                        <p className="text-sm font-bold text-slate-900">
                          {Math.round(
                            (Object.values(completedMilestones).filter(Boolean).length / 
                            recommendation.roadmap.reduce((acc, p) => acc + p.milestones.length, 0)) * 100
                          )}% Complete
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative">
                        <svg className="w-full h-full transform -rotate-90 absolute">
                          <circle 
                            cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 * (1 - (Object.values(completedMilestones).filter(Boolean).length / recommendation.roadmap.reduce((acc, p) => acc + p.milestones.length, 0)))}
                            className="text-emerald-500 transition-all duration-500" 
                          />
                        </svg>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                  {recommendation.roadmap.map((item, i) => {
                    const accessible = isPhaseAccessible(i);
                    const completed = isPhaseCompleted(i, item.milestones);
                    const progress = getPhaseProgress(i, item.milestones);

                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "relative pl-14 transition-all duration-500",
                          !accessible && "opacity-50 grayscale pointer-events-none"
                        )}
                      >
                        {/* Phase Indicator */}
                        <div className={cn(
                          "absolute left-0 top-1 w-12 h-12 rounded-full flex items-center justify-center z-10 shadow-md border-4 transition-colors duration-500",
                          completed ? "bg-emerald-500 border-emerald-100 text-white" :
                          accessible ? "bg-white border-blue-100 text-blue-600" :
                          "bg-slate-100 border-slate-50 text-slate-400"
                        )}>
                          {completed ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">{i + 1}</span>}
                        </div>

                        {/* Phase Card */}
                        <div className={cn(
                          "bg-white p-6 rounded-3xl border transition-all duration-300 space-y-4",
                          completed ? "border-emerald-200 shadow-emerald-500/5 shadow-xl" :
                          accessible ? "border-blue-200 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20" :
                          "border-slate-200"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {item.phase}
                                {completed && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Verified</span>}
                              </h4>
                              <p className="text-slate-500 text-xs">{item.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phase Progress</span>
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  className={cn("h-full rounded-full", completed ? "bg-emerald-500" : "bg-blue-600")}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {item.milestones.map((m, j) => {
                              const isDone = completedMilestones[`${i}-${j}`];
                              return (
                                <button 
                                  key={j} 
                                  onClick={() => toggleMilestone(i, j)}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-2xl border text-left transition-all group",
                                    isDone 
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                      : "bg-white border-slate-100 text-slate-600 hover:border-blue-400 hover:shadow-sm"
                                  )}
                                >
                                  <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors mt-0.5",
                                    isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 group-hover:border-blue-500"
                                  )}>
                                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </div>
                                  <span className={cn("text-xs font-medium leading-tight", isDone && "line-through opacity-70")}>
                                    {m}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Assistant Call to action */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative pl-14 pt-4"
                  >
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Need a detailed daily schedule?</p>
                          <p className="text-slate-500 text-xs mt-1 leading-relaxed">I can break down Phase 1 into a granular weekly study plan for you.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          // We'll trust the user will see the assistant open
                          const assistantBtn = document.querySelector('button.fixed.bottom-6.right-6') as HTMLButtonElement;
                          if (assistantBtn) assistantBtn.click();
                        }}
                        className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap"
                      >
                        Generate Detailed Plan
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Strategy Card */}
              <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="flex items-center gap-2 relative z-10">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h3 className="text-2xl font-bold">Off-Campus Strategy</h3>
                </div>
                <div className="prose prose-invert prose-sm max-w-none relative z-10">
                  <ReactMarkdown>{recommendation.offCampusStrategy}</ReactMarkdown>
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-2xl font-bold">Curated Resources</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendation.resources.map((resource, i) => (
                    <a 
                      key={i}
                      href={resource.link || "#"}
                      target="_blank"
                      className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-emerald-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {resource.type === 'course' ? <BookOpen className="w-5 h-5" /> : 
                           resource.type === 'article' ? <Briefcase className="w-5 h-5" /> :
                           resource.type === 'project' ? <Target className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm">{resource.title}</h5>
                          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 pt-0.5">
                            <span>{resource.type}</span>
                            <span>•</span>
                            <span className={resource.isFree ? "text-emerald-500" : "text-amber-500"}>{resource.isFree ? "FREE" : "PAID"}</span>
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setStep('intro')}
                  className="px-8 py-3 rounded-full border border-slate-200 font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Retake Assessment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-slate-200 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale">
            <Compass className="w-5 h-5" />
            <span className="text-lg font-bold tracking-tight">PathFinder AI</span>
          </div>
          <p className="text-sm text-slate-500">Helping students from all backgrounds find their true potential.</p>
          <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Persistent AI Assistant */}
      <AIChatAssistant profile={profile} recommendation={recommendation} />
    </div>
  );
}
