import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Terminal, Server, Monitor, Play, Clock, Shield, Cpu, HardDrive, Zap } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowText from '@/components/GlowText';
import GlowButton from '@/components/GlowButton';
import AnimatedLabIcon from '@/components/AnimatedLabIcon';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';

type Lab = {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
  specs?: { ram?: string; storage?: string; cpu?: string };
  difficulty?: string;
  color?: string;
  available?: boolean;
};

const Labs = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/labs')
      .then((data: any) => {
        if (!mounted) return;
        setLabs(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
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


const difficultyColors = {
  Beginner: 'bg-green-500/10 text-green-500 border-green-500/30',
  Intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  Advanced: 'bg-red-500/10 text-red-500 border-red-500/30',
};

  if (loading) return <Loading message="Loading labs..." />;
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Virtual Labs</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Hands-on{' '}
              <GlowText as="span" color="gradient" animate={false}>
                Cyber Labs
              </GlowText>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Practice on real operating systems in isolated environments. 
              Launch Kali Linux, Ubuntu, Windows, and more with one click.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {[
              { icon: Server, label: 'Available Labs', value: '6+' },
              { icon: Clock, label: 'Lab Sessions', value: '50K+' },
              { icon: Shield, label: 'Secure VMs', value: '100%' },
              { icon: Zap, label: 'Instant Launch', value: '<30s' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 text-center"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Labs Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-56 w-full rounded-lg" />
                  <Skeleton className="h-6 mt-3 w-3/4" />
                  <Skeleton className="h-4 mt-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab, index) => (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <GlowCard glowColor={lab.color} className={!lab.available ? 'opacity-60' : ''}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AnimatedLabIcon icon={lab.icon} name={lab.name} />
                      <div>
                        <h3 className="text-lg font-semibold">{lab.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={difficultyColors[lab.difficulty as keyof typeof difficultyColors]}
                        >
                          {lab.difficulty}
                        </Badge>
                      </div>
                    </div>
                    {!lab.available && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{lab.description}</p>

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-background/50 rounded-lg p-2 text-center">
                      <Cpu className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">CPU</p>
                      <p className="text-sm font-medium">{lab.specs?.cpu}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2 text-center">
                      <Monitor className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">RAM</p>
                      <p className="text-sm font-medium">{lab.specs?.ram}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2 text-center">
                      <HardDrive className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Storage</p>
                      <p className="text-sm font-medium">{lab.specs?.storage}</p>
                    </div>
                  </div>

                  <GlowButton 
                    variant="primary" 
                    className="w-full" 
                    disabled={!lab.available}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      {lab.available ? 'Launch Lab' : 'Coming Soon'}
                    </span>
                  </GlowButton>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Labs;
