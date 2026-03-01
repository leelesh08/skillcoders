import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, ShoppingCart, Star, Cpu } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowText from '@/components/GlowText';
import GlowButton from '@/components/GlowButton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

interface Gadget {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  inStock: boolean;
}

const gadgets: Gadget[] = [
  {
    id: 1,
    name: 'WiFi Pineapple Mark VII',
    description: 'Advanced wireless auditing platform for penetration testers.',
    price: 25999,
    rating: 4.9,
    reviews: 324,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    category: 'Network',
    inStock: true,
  },
  {
    id: 2,
    name: 'Rubber Ducky USB',
    description: 'USB keystroke injection attack platform.',
    price: 4999,
    rating: 4.8,
    reviews: 567,
    image: 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=400&h=300&fit=crop',
    category: 'USB',
    inStock: true,
  },
  {
    id: 3,
    name: 'LAN Turtle',
    description: 'Covert systems administration and penetration testing tool.',
    price: 7999,
    rating: 4.7,
    reviews: 234,
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop',
    category: 'Network',
    inStock: true,
  },
  {
    id: 4,
    name: 'HackRF One',
    description: 'Software defined radio for analyzing wireless protocols.',
    price: 32999,
    rating: 4.9,
    reviews: 189,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    category: 'Radio',
    inStock: false,
  },
  {
    id: 5,
    name: 'Proxmark3 RDV4',
    description: 'RFID and NFC research and cloning device.',
    price: 28999,
    rating: 4.8,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400&h=300&fit=crop',
    category: 'RFID',
    inStock: true,
  },
  {
    id: 6,
    name: 'Flipper Zero',
    description: 'Portable multi-tool for pentesters and hardware enthusiasts.',
    price: 19999,
    rating: 4.9,
    reviews: 892,
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop',
    category: 'Multi-tool',
    inStock: true,
  },
];

const Gadgets = () => {
  const { add } = useCart();
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  const handleAddToCart = (gadget: Gadget) => {
    add({ id: gadget.id, title: gadget.name, price: gadget.price ?? 0, quantity: 1 });
  };

  const handleBuy = async (gadget: Gadget) => {
    try {
      setProcessingId(gadget.id);
      const payload = { type: 'gadget', id: gadget.id, amount: gadget.price ?? 0, title: gadget.name };
      const res = await api.post('/checkout', payload).catch(() => null) as { orderId?: string; url?: string; sessionId?: string } | null;
      if (res && res.orderId) {
        window.location.href = `/checkout/status?orderId=${encodeURIComponent(res.orderId)}`;
        return;
      }
      if (res && res.url) {
        window.location.href = res.url;
        return;
      }
      if (res && res.sessionId) {
        const pk = import.meta.env.VITE_STRIPE_PK as string | undefined;
        if (!pk) {
          window.location.href = `/checkout/status?session_id=${encodeURIComponent(res.sessionId)}`;
          return;
        }
        try {
          const stripeModule = await import('@stripe/stripe-js');
          const stripe = await stripeModule.loadStripe(pk);
          if (stripe) await stripe.redirectToCheckout({ sessionId: res.sessionId });
        } catch (e) {
          console.error('Stripe redirect failed', e);
          alert('Unable to redirect to Stripe checkout');
        }
      }
      // fallback
      alert('Proceeding to payment...');
    } catch (err) {
      console.error('Buy failed', err);
      alert('Unable to start purchase');
    } finally {
      setProcessingId(null);
    }
  };
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
                      src={gadget.image}
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
                      {gadget.category}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{gadget.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{gadget.description}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">{gadget.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({gadget.reviews} reviews)
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl font-bold text-primary">
                        ₹{gadget.price.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <GlowButton 
                          variant="secondary"
                          size="sm"
                          disabled={!gadget.inStock}
                          onClick={() => handleAddToCart(gadget)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {gadget.inStock ? 'Add to Cart' : 'Notify Me'}
                        </GlowButton>
                        <GlowButton
                          variant="primary"
                          size="sm"
                          disabled={!gadget.inStock || processingId === gadget.id}
                          onClick={() => handleBuy(gadget)}
                        >
                          {processingId === gadget.id ? 'Processing...' : 'Buy Now'}
                        </GlowButton>
                      </div>
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
