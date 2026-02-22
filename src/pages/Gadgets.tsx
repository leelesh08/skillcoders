import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Search, ShoppingCart, Star, Shield, Cpu, Headphones, Usb, Wifi, ExternalLink } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowText from '@/components/GlowText';
import GlowButton from '@/components/GlowButton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';

type Gadget = {
  id: string | number;
  name: string;
  description?: string;
  price?: number;
  rating?: number;
  reviews?: number;
  image?: string;
  category?: string;
  inStock?: boolean;
};

const Gadgets = () => {
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/gadgets')
      .then((data: any) => {
        if (!mounted) return;
        setGadgets(Array.isArray(data) ? data : []);
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

  if (loading) return <Loading message="Loading gadgets..." />;
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
              <Cpu className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Security Gadgets</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <GlowText as="span" color="gradient" animate={false}>
                Hacker's
              </GlowText>
              {' '}Arsenal
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional-grade security tools and gadgets for ethical hackers and penetration testers.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-xl mx-auto mb-12"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search gadgets..."
                className="pl-10 bg-card border-border"
              />
            </div>
          </motion.div>

          {/* Gadgets Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-6 mt-3 w-3/4" />
                  <Skeleton className="h-4 mt-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gadgets.map((gadget, index) => (
              <motion.div
                key={gadget.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <GlowCard className="p-0 overflow-hidden" glowColor="cyan">
                  <div className="relative">
                    <img
                      src={gadget.image ?? ''}
                      alt={gadget.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <Badge 
                      className={`absolute top-3 left-3 ${
                        gadget.inStock ? 'bg-green-500/80' : 'bg-red-500/80'
                      }`}
                    >
                      {gadget.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                    <Badge variant="outline" className="absolute top-3 right-3 bg-background/80">
                      {gadget.category ?? ''}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{gadget.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{gadget.description}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">{gadget.rating ?? '-'}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({(gadget.reviews ?? 0)} reviews)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        ₹{(gadget.price ?? 0).toLocaleString()}
                      </span>
                      <GlowButton 
                        variant="primary" 
                        size="sm"
                        disabled={!gadget.inStock}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {gadget.inStock ? 'Add to Cart' : 'Notify Me'}
                      </GlowButton>
                    </div>
                  </div>
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

export default Gadgets;
