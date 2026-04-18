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
  X,
  Globe
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

  const [loadingStage, setLoadingStage] = useState(0);
  const loadingStages = [
    { message: "Initiating deep profile analysis...", icon: Brain, color: "text-blue-500" },
    { message: "Scanning for high-demand career roles...", icon: Compass, color: "text-indigo-500" },
    { message: "Fetching verified industry resources...", icon: Globe, color: "text-emerald-500" },
    { message: "Simulating your 12-month journey...", icon: Sparkles, color: "text-amber-500" },
    { message: "Identifying Tier 2/3 off-campus hacks...", icon: Rocket, color: "text-blue-600" },
    { message: "Wait a minute, doing final number crunching...", icon: Loader2, color: "text-slate-500" },
    { message: "Almost ready! Polishing your roadmap...", icon: CheckCircle2, color: "text-emerald-600" }
  ];

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    setCompletedMilestones({});
    setLoadingStage(0);
    
    // Linear progression for loading stages
    const totalStages = loadingStages.length;
    const stageInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < totalStages - 1) return prev + 1;
        return prev; // Stay at the last stage until done
      });
    }, 4500); // 4.5s per stage = ~31s of content before hanging at the last stage

    try {
      const rec = await getCareerRecommendation(profile);
      setRecommendation(rec);
      setStep('results');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("PathFinder Error:", err);
      setError("AI failed to generate a roadmap. This usually happens due to network issues. Please try again.");
    } finally {
      clearInterval(stageInterval);
      setLoading(false);
      setLoadingStage(0);
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

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xl"
            >
              <div className="max-w-md w-full px-8 text-center space-y-8">
                <div className="relative h-48 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={loadingStage}
                      initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
                      className={cn("p-8 rounded-full bg-white shadow-2xl border", loadingStages[loadingStage].color.replace('text', 'border'))}
                    >
                      {(() => {
                        const Icon = loadingStages[loadingStage].icon;
                        return <Icon className={cn("w-16 h-16", loadingStages[loadingStage].color)} />;
                      })()}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Floating particles */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-slate-200 rounded-full scale-150 opacity-20"
                  />
                </div>

                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.h3
                      key={loadingStage}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-2xl font-black tracking-tight text-slate-900"
                    >
                      {loadingStages[loadingStage].message}
                    </motion.h3>
                  </AnimatePresence>
                  
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600"
                        animate={{ 
                          width: `${((loadingStage + 1) / loadingStages.length) * 100}%` 
                        }}
                        transition={{ duration: 3.5, ease: "linear" }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-slate-400">
                      <span>{loadingStage === loadingStages.length - 1 ? "Finalizing" : "In Progress"}</span>
                      <span>{Math.min(99, Math.round(((loadingStage + 1) / loadingStages.length) * 100))}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-500 font-medium italic">
                  {loadingStage > 4 ? "Hang tight, the best results take a little longer..." : "\"The best way to predict the future is to create it.\""}
                </p>
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
              className="space-y-16 relative"
            >
              {/* Premium Background Decorations */}
              <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] left-[10%] w-[20%] h-[20%] bg-purple-500/3 blur-[100px] rounded-full" />
              </div>

              {/* Header result */}
              <div className="text-center space-y-8 relative">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600/5 text-blue-700 rounded-full text-sm font-bold border border-blue-200/50 backdrop-blur-sm shadow-sm"
                >
                  <Rocket className="w-4 h-4" />
                  AI Architect: Personalized Discovery
                </motion.div>
                
                <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
                  {recommendation.role.split(' ').map((word, i) => (
                    <span key={i} className={i % 2 === 1 ? 'gradient-text' : 'text-slate-900'}>{word} </span>
                  ))}
                </h2>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-10 mt-10">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full group-hover:bg-emerald-500/30 transition-all" />
                    <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-2xl border border-emerald-100">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                        <motion.circle 
                          cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 50}
                          initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                          animate={{ strokeDashoffset: (2 * Math.PI * 50) * (1 - recommendation.suitabilityScore / 100) }}
                          className="text-emerald-500"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-slate-900 leading-none">{recommendation.suitabilityScore}%</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 mt-1">Match Score</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left max-w-lg space-y-4">
                    <p className="text-xl text-slate-600 leading-relaxed font-medium italic relative">
                      <span className="absolute -left-6 -top-2 text-4xl text-blue-200 font-serif">"</span>
                      {recommendation.description}
                      <span className="text-4xl text-blue-200 font-serif align-bottom ml-1">"</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* YouTube Masterclass Section - NEW PREMIUM FEATURE */}
              {recommendation.youtubeVideoId && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative group p-1 bg-linear-to-br from-red-500/20 via-orange-500/20 to-indigo-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-slate-900" />
                  <div className="relative bg-slate-900/40 backdrop-blur-3xl rounded-[2.4rem] p-8 sm:p-12 space-y-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-500">
                          <Rocket className="w-5 h-5 fill-red-500" />
                          <span className="text-xs font-black uppercase tracking-widest">Masterclass Selection</span>
                        </div>
                        <h3 className="text-3xl font-bold text-white tracking-tight">Watch the Expert Roadmap</h3>
                        <p className="text-slate-400 text-sm max-w-md">We've identified the highest-rated tutorial to complement your journey. Watch and learn directly on PathFinder.</p>
                      </div>
                      <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                        <Users className="w-5 h-5 text-white/60" />
                        <div className="text-left">
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none">Global Impact</p>
                          <p className="text-sm font-bold text-white">Top 1% Resource</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                      <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${recommendation.youtubeVideoId}?autoplay=0&rel=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suitability Breakdown & Career Insight */}

              {/* Suitability Breakdown - UNIQUE FEATURE 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="premium-card p-10 rounded-[2.5rem] space-y-8 glow-blue">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">Expert Skill Analysis</h3>
                  </div>
                  <div className="space-y-6">
                    {recommendation.suitabilityBreakdown.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>{item.skill}</span>
                          <span className="text-blue-600">{item.matchLevel}% Match</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.matchLevel}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] space-y-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                  <div className="flex items-center gap-3 relative">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">Elite Career Strategy</h3>
                  </div>
                  <div className="space-y-4 relative">
                    <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                      "Leveraging your Tier {profile.collegeTier.replace('tier', '')} background as a unique advantage."
                    </p>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                      <p className="text-white/90 text-sm font-bold leading-relaxed">
                        Your core edge lies in **{recommendation.suitabilityBreakdown[0]?.skill}**. We recommend focusing heavily on open-source contributions to bypass traditional recruitment filters.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const btn = document.querySelector('[data-assistant-toggle]') as HTMLButtonElement;
                        if (btn) btn.click();
                      }}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      Deep Dive with AI Assistant
                    </button>
                  </div>
                </div>
              </div>

              {/* The Bridge Analysis ... (rest remains same but I'll update it for consistent imports if needed) */}

              {/* The Bridge Analysis - UNIQUE FEATURE 2 */}
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-2xl shadow-lg ring-4 ring-slate-900/10">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight">The Bridge Analysis</h3>
                    <p className="text-slate-500 text-sm">Translating your college curriculum into industry standard skills.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {recommendation.gapAnalysis.map((item, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5 }}
                      className="group grid grid-cols-1 md:grid-cols-3 premium-card rounded-[2rem] overflow-hidden"
                    >
                      <div className="p-8 bg-slate-50/50 border-r border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">College Focus</span>
                        <p className="text-base font-bold text-slate-700 leading-tight">{item.collegeCurriculum}</p>
                      </div>
                      <div className="p-8 bg-white flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] block mb-2">Industry Reality</span>
                        <p className="text-base font-bold text-slate-900 leading-tight">{item.industryRequirement}</p>
                      </div>
                      <div className="p-8 bg-blue-600 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-2.5 bg-white/20 rounded-xl text-white backdrop-blur-md">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="relative">
                          <span className="text-[10px] font-black uppercase text-blue-100/70 tracking-[0.2em] block mb-1">Your Bridge</span>
                          <p className="text-sm font-bold text-white leading-tight">{item.actionToBridge}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Roadmap Section */}
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight">Step-by-Step Path</h3>
                      <p className="text-slate-500 text-sm">Your multi-phase journey to mastering {recommendation.role}.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-12 relative">
                  {/* Vertical connecting line */}
                  <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-linear-to-b from-blue-500 via-indigo-400 to-transparent opacity-30" />
                  
                  {recommendation.roadmap.map((item, i) => {
                    const accessible = isPhaseAccessible(i);
                    const completed = isPhaseCompleted(i, item.milestones);
                    const progress = getPhaseProgress(i, item.milestones);

                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "relative pl-14 transition-all duration-500",
                          !accessible && "opacity-40 grayscale pointer-events-none"
                        )}
                      >
                        {/* Phase Indicator */}
                        <div className={cn(
                          "absolute left-0 top-1 w-12 h-12 rounded-2xl flex items-center justify-center z-10 shadow-xl border-2 transition-all duration-500 animate-float",
                          completed ? "bg-emerald-500 border-white text-white rotate-12" :
                          accessible ? "bg-white border-blue-500 text-blue-600 -rotate-3" :
                          "bg-slate-100 border-slate-200 text-slate-400"
                        )}>
                          {completed ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-lg font-black">{i + 1}</span>}
                        </div>

                        {/* Phase Card */}
                        <div className={cn(
                          "premium-card p-8 rounded-[2.5rem] transition-all duration-300 space-y-6 relative overflow-hidden",
                          accessible && "glow-blue"
                        )}>
                          {accessible && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />}
                          
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative">
                            <div className="space-y-1 text-center sm:text-left">
                              <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3 justify-center sm:justify-start">
                                {item.phase}
                                {completed && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase font-black tracking-widest">Mastered</span>}
                              </h4>
                              <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.description}</p>
                            </div>
                            <div className="text-center sm:text-right shrink-0 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phase Success</span>
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className={cn("h-full rounded-full transition-all duration-1000", completed ? "bg-emerald-500" : "bg-blue-600")}
                                  />
                                </div>
                                <span className="text-xs font-black text-slate-900">{Math.round(progress)}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                            {item.milestones.map((m, j) => {
                              const isDone = completedMilestones[`${i}-${j}`];
                              return (
                                <button 
                                  key={j} 
                                  onClick={() => toggleMilestone(i, j)}
                                  className={cn(
                                    "flex flex-col gap-3 p-5 rounded-3xl border-2 text-left transition-all group relative overflow-hidden",
                                    isDone 
                                      ? "bg-emerald-50 border-emerald-500 text-emerald-900" 
                                      : "bg-white border-slate-100 text-slate-600 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 shadow-sm"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className={cn(
                                      "w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all",
                                      isDone ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white border-slate-200 group-hover:border-blue-500"
                                    )}>
                                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Lightbulb className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />}
                                    </div>
                                    <ArrowRight className={cn("w-4 h-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1", isDone ? "text-emerald-500" : "text-blue-500")} />
                                  </div>
                                  <span className={cn("text-sm font-bold leading-tight", isDone && "line-through opacity-70")}>
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
              <div className="relative group">
                <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative bg-slate-900 text-white p-12 rounded-[3rem] space-y-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Off-Campus Tactical Edge</h3>
                  </div>
                  <div className="prose prose-invert prose-lg max-w-none relative z-10 prose-headings:text-white prose-p:text-slate-300 prose-strong:text-blue-400 prose-ul:list-disc">
                    <ReactMarkdown>{recommendation.offCampusStrategy}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight">Curated Learning Library</h3>
                    <p className="text-slate-500 text-sm">Hand-picked industry resources to accelerate your growth.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
                  {recommendation.resources.map((resource, i) => (
                    <motion.a 
                      key={i}
                      href={resource.sourceUrl || resource.link || "#"}
                      target="_blank"
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-8 rounded-[2rem] flex flex-col justify-between group transition-all duration-500 relative overflow-hidden border-2",
                        resource.type === 'search_result' 
                          ? "bg-linear-to-br from-indigo-50/50 to-white border-indigo-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20" 
                          : "bg-white border-slate-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10"
                      )}
                    >
                      {resource.type === 'search_result' && (
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/10 transition-colors" />
                      )}
                      
                      <div className="flex items-start gap-6 relative z-10 w-full">
                        <div className={cn(
                          "p-4 rounded-2xl transition-all duration-500 shrink-0 shadow-lg",
                          resource.type === 'search_result'
                            ? "bg-indigo-600 text-white group-hover:scale-110"
                            : "bg-white border border-slate-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110"
                        )}>
                          {resource.type === 'course' ? <BookOpen className="w-6 h-6" /> : 
                           resource.type === 'article' ? <Briefcase className="w-6 h-6" /> :
                           resource.type === 'project' ? <Target className="w-6 h-6" /> : 
                           resource.type === 'search_result' ? <Globe className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-4 space-y-3">
                          <h5 className="font-black text-lg leading-tight text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">{resource.title}</h5>
                          {resource.type === 'search_result' && resource.searchedSnippet && (
                            <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                              "{resource.searchedSnippet}"
                            </p>
                          )}
                          <div className="flex items-center gap-3 pt-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              resource.type === 'search_result' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                            )}>
                              {resource.type === 'search_result' ? 'Live Insight' : resource.type}
                            </span>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              resource.isFree ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {resource.isFree ? "FREE" : "PAID"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        resource.type === 'search_result' ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white"
                      )}>
                        <ExternalLink className="w-5 h-5" />
                      </div>
                    </motion.a>
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
