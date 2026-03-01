import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
 import { Code, Terminal, Users, Trophy, Zap, BookOpen, Target, ArrowRight, Play, Star, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
 import Footer from '@/components/Footer';
 import IPSecurityBanner from '@/components/IPSecurityBanner';
import GlowButton from '@/components/GlowButton';
import GlowCard from '@/components/GlowCard';
import GlowText from '@/components/GlowText';

const featuresConst = [
  {
    icon: Terminal,
    title: 'Hands-on Labs',
    description: 'Practice on real systems with Kali Linux, Ubuntu, Windows, and more.',
    color: 'blue' as const,
  },
  {
    icon: Trophy,
    title: 'Battles',
    description: 'Join Red vs Blue team battles, form groups, and compete for certificates and prize pools.',
    color: 'red' as const,
  },
  {
    icon: BookOpen,
    title: 'Expert Courses',
    description: 'Learn from certified instructors with 5-star rated content.',
    color: 'purple' as const,
  },
  {
    icon: Target,
    title: '100 Level Quizzes',
    description: 'Progress through challenging quizzes and earn credits.',
    color: 'cyan' as const,
  },
];

const statsConst = [
  { value: '10K+', label: 'Students' },
  { value: '500+', label: 'Courses' },
  { value: '50+', label: 'Instructors' },
  { value: '1M+', label: 'Quizzes Solved' },
];

const Index = () => {
  const [features, setFeatures] = useState(featuresConst);
  const [stats, setStats] = useState(statsConst);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([api.get('/features').catch(() => null), api.get('/stats').catch(() => null)])
      .then(([f, s]) => {
        if (!mounted) return;
        if (Array.isArray(f)) setFeatures(f);
        if (Array.isArray(s)) setStats(s);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || String(err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading message="Loading homepage..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />
       <IPSecurityBanner />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Cybersecurity Learning Platform</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Master{' '}
              <GlowText as="span" color="gradient" animate={false}>
                Cybersecurity
              </GlowText>
              <br />
              <span className="text-foreground">Skills That Matter</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students learning ethical hacking, penetration testing, 
              and cybersecurity through hands-on labs, exciting battles (win certificates and prizes), and expert-led courses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <GlowButton variant="primary" size="lg">
                  <span className="flex items-center gap-2">
                    Start Learning Free
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </GlowButton>
              </Link>
              <Link to="/courses">
                <GlowButton variant="outline" size="lg">
                  <span className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Explore Courses
                  </span>
                </GlowButton>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold glow-text mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to{' '}
              <GlowText as="span" color="blue" animate={false}>
                Succeed
              </GlowText>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and resources you need 
              to become a cybersecurity professional.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard glowColor={feature.color}>
                  <feature.icon className={`w-10 h-10 mb-4 text-cyber-${feature.color}`} />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Section */}
      <section className="py-20 px-4 relative" id="career">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-6">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-sm text-secondary font-medium">Career Opportunities</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Become an{' '}
                <GlowText as="span" color="purple" animate={false}>
                  Instructor
                </GlowText>
              </h2>
              <p className="text-muted-foreground mb-6">
                Share your expertise with thousands of students. Join our team of certified 
                instructors and earn while teaching cybersecurity skills. Part-time or full-time 
                opportunities available.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Manage unlimited students',
                  'Create and sell courses',
                  'Conduct live quizzes',
                  'Build your personal brand',
                  'Flexible working hours',
                ].map((item, index) => (
                  <li key={item}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </motion.div>
                  </li>
                ))}
              </ul>
              <Link to="/career">
                <GlowButton variant="secondary" size="lg">
                  <span className="flex items-center gap-2">
                    Join as Instructor
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </GlowButton>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden glow-border p-1">
                <div className="bg-card rounded-xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Code className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Top Instructor</h4>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        ))}
                        <span className="text-muted-foreground text-sm ml-2">5.0 (2.4k reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Students</span>
                      <span className="font-semibold">12,450</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Courses Published</span>
                      <span className="font-semibold">24</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Earnings</span>
                      <span className="font-semibold text-primary">₹1,50,000+</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-card border border-border rounded-lg p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Top Rated</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-12 text-center"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 via-primary/20 to-cyber-red/20" />
            <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Start Your{' '}
                <GlowText as="span" color="gradient" animate={false}>
                  Journey?
                </GlowText>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join our community of cybersecurity enthusiasts and start your path 
                to becoming a certified professional today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <GlowButton variant="primary" size="lg">
                    Create Free Account
                  </GlowButton>
                </Link>
                <Link to="/courses">
                  <GlowButton variant="outline" size="lg">
                    Browse Courses
                  </GlowButton>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

       <Footer />
    </div>
  );
};

export default Index;
