 import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
 import { Brain, Trophy, Zap, Target, ChevronRight, Star, Lock, CheckCircle } from 'lucide-react';
 import ParticleBackground from '@/components/ParticleBackground';
 import Navbar from '@/components/Navbar';
 import Footer from '@/components/Footer';
 import GlowCard from '@/components/GlowCard';
import { quizDomains as quizDomainsConst, getLevelQuestions, getLevelCredits, sampleQuestions, QuizQuestion } from '@/data/quizQuestions';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
 import GlowText from '@/components/GlowText';
 import GlowButton from '@/components/GlowButton';
 import QuizModal from '@/components/QuizModal';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 
 const domains = quizDomainsConst.map((d) => ({ ...d, completed: 0 }));

 const defaultLevels = Array.from({ length: 10 }, (_, i) => ({
   level: i + 1,
   questions: getLevelQuestions(i + 1),
   credits: getLevelCredits(i + 1),
   unlocked: i === 0,
 }));
 
 const Quizzes = () => {
   const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
   const [showQuiz, setShowQuiz] = useState(false);
   const [activeLevel, setActiveLevel] = useState(1);
   const [userStats, setUserStats] = useState({
     currentLevel: 1,
     totalCredits: 0,
     completed: 0,
     streak: 0,
   });
   const [domainsState, setDomainsState] = useState(domains);
   const [levelsState, setLevelsState] = useState(defaultLevels);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     let mounted = true;
     setLoading(true);
     Promise.all([api.get('/quiz-domains').catch(() => null), api.get('/quiz-levels').catch(() => null)])
       .then(([d, l]) => {
         if (!mounted) return;
         if (Array.isArray(d) && d.length) setDomainsState(d);
         if (Array.isArray(l) && l.length) setLevelsState(l);
       })
       .catch((err) => {
         if (!mounted) return;
         setError(err?.message || String(err));
       })
       .finally(() => {
         if (!mounted) return;
         setLoading(false);
       });

     return () => {
       mounted = false;
     };
   }, []);
 
   const getQuestionsForDomain = (domainId: number): QuizQuestion[] => {
     const domain = quizDomains.find(d => d.id === domainId);
     if (!domain) return [];
     const domainQuestions = sampleQuestions.filter(q => q.domain === domain.name);
     if (domainQuestions.length === 0) {
       // Fallback to all questions if no domain-specific ones
       return sampleQuestions.slice(0, 5);
     }
     return domainQuestions.slice(0, 5);
   };
 
   const selectedDomainData = useMemo(() => {
     return domainsState.find((d: any) => d.id === selectedDomain);
   }, [selectedDomain, domainsState]);
 
   const handleStartQuiz = (level: number) => {
     if (!selectedDomain) return;
     setActiveLevel(level);
     setShowQuiz(true);
   };
 
   const handleQuizComplete = (score: number, total: number) => {
     const passed = score >= total * 0.7;
     if (passed) {
       const credits = getLevelCredits(activeLevel);
       setUserStats(prev => ({
         ...prev,
         totalCredits: prev.totalCredits + credits,
         completed: prev.completed + 1,
         currentLevel: Math.max(prev.currentLevel, activeLevel + 1),
         streak: prev.streak + 1,
       }));
     }
   };
 
   const quizQuestions = useMemo(() => {
     if (!selectedDomain) return [];
     return getQuestionsForDomain(selectedDomain);
   }, [selectedDomain]);

  if (loading) return <Loading message="Loading quizzes..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-4">
              <Brain className="w-4 h-4 text-secondary" />
              <span className="text-sm text-secondary font-medium">Quiz Arena</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <GlowText as="span" color="gradient" animate={false}>
                100 Level
              </GlowText>
              {' '}Challenge
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Progress through 100 levels of increasingly challenging quizzes. 
              Each level unlocks more questions and higher credit rewards.
            </p>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {[
               { icon: Target, label: 'Current Level', value: String(userStats.currentLevel), color: 'text-primary' },
               { icon: Trophy, label: 'Total Credits', value: String(userStats.totalCredits), color: 'text-yellow-500' },
               { icon: CheckCircle, label: 'Completed', value: `${userStats.completed}/100`, color: 'text-green-500' },
               { icon: Zap, label: 'Streak', value: `${userStats.streak} days`, color: 'text-secondary' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 text-center"
              >
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Domain Selection */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Select Domain</h2>
              <div className="space-y-3">
                {domains.map((domain, index) => (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <button
                      onClick={() => setSelectedDomain(domain.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedDomain === domain.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{domain.icon}</span>
                          <div>
                            <p className="font-medium">{domain.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {domain.questions} questions
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${
                          selectedDomain === domain.id ? 'text-primary rotate-90' : 'text-muted-foreground'
                        }`} />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Levels */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Progress Through Levels</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {levels.map((level, index) => (
                  <motion.div
                    key={level.level}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <GlowCard 
                      glowColor={level.unlocked ? 'blue' : 'purple'} 
                      hover={level.unlocked}
                      className={!level.unlocked ? 'opacity-60' : ''}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {level.unlocked ? (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">{level.level}</span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">Level {level.level}</p>
                            <p className="text-xs text-muted-foreground">
                              {level.questions} questions
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          {level.credits}
                        </Badge>
                      </div>

                      {level.unlocked && (
                        <>
                          <Progress value={0} className="h-2 mb-3" />
                          <GlowButton 
                            variant="primary" 
                            size="sm" 
                            className="w-full"
                            disabled={!selectedDomain}
                           onClick={() => handleStartQuiz(level.level)}
                          >
                            {selectedDomain ? 'Start Quiz' : 'Select Domain First'}
                          </GlowButton>
                        </>
                      )}
                    </GlowCard>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-muted-foreground mt-6"
              >
                Complete levels 1-50 to unlock expert challenges with 100-10,000 questions per level!
              </motion.p>
            </div>
          </div>
        </div>
      </main>
       <Footer />
 
       <QuizModal
         isOpen={showQuiz}
         onClose={() => setShowQuiz(false)}
         questions={quizQuestions}
         domainName={selectedDomainData?.name || ''}
         level={activeLevel}
         creditsReward={getLevelCredits(activeLevel)}
         onComplete={handleQuizComplete}
       />
    </div>
  );
};

export default Quizzes;
