import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, Users, Star, Play, BookOpen } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowText from '@/components/GlowText';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useCart } from '@/contexts/CartContext';

type Course = {
  id: string | number;
  title: string;
  instructor?: string;
  rating?: number;
  students?: number;
  duration?: string;
  price?: number;
  image?: string;
  level?: string;
  category?: string;
};

type CheckoutResponse = {
  orderId?: string;
  url?: string;
  sessionId?: string;
};

const FALLBACK_COURSES: Course[] = [
  {
    id: 1,
    title: 'Ethical Hacking Masterclass',
    instructor: 'Alex Security',
    rating: 4.9,
    students: 12450,
    duration: '42 hours',
    price: 4999,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop',
    level: 'Advanced',
    category: 'Penetration Testing',
  },
  {
    id: 2,
    title: 'Web Application Security',
    instructor: 'Sarah White',
    rating: 4.8,
    students: 8920,
    duration: '36 hours',
    price: 3999,
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=250&fit=crop',
    level: 'Intermediate',
    category: 'Web Security',
  },
  {
    id: 3,
    title: 'Network Security Fundamentals',
    instructor: 'Mike Chen',
    rating: 4.7,
    students: 15670,
    duration: '28 hours',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
    level: 'Beginner',
    category: 'Network Security',
  },
  {
    id: 4,
    title: 'Malware Analysis & Reverse Engineering',
    instructor: 'David Black',
    rating: 4.9,
    students: 6340,
    duration: '48 hours',
    price: 5999,
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=250&fit=crop',
    level: 'Expert',
    category: 'Malware Analysis',
  },
  {
    id: 5,
    title: 'Bug Bounty Hunting',
    instructor: 'Lisa Hunt',
    rating: 4.8,
    students: 9870,
    duration: '32 hours',
    price: 3499,
    image: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=400&h=250&fit=crop',
    level: 'Intermediate',
    category: 'Bug Bounty',
  },
  {
    id: 6,
    title: 'Cloud Security (AWS/Azure)',
    instructor: 'John Cloud',
    rating: 4.6,
    students: 7230,
    duration: '40 hours',
    price: 4499,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
    level: 'Advanced',
    category: 'Cloud Security',
  },

  // ── AI / ML ──────────────────────────────────────────────────────
  {
    id: 7,
    title: 'Machine Learning with Python',
    instructor: 'Dr. Priya Sharma',
    rating: 4.9,
    students: 23100,
    duration: '52 hours',
    price: 5499,
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=250&fit=crop',
    level: 'Intermediate',
    category: 'Machine Learning',
  },
  {
    id: 8,
    title: 'Deep Learning & Neural Networks',
    instructor: 'Arjun Patel',
    rating: 4.8,
    students: 17450,
    duration: '60 hours',
    price: 6999,
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop',
    level: 'Advanced',
    category: 'Deep Learning',
  },
  {
    id: 9,
    title: 'Generative AI & Prompt Engineering',
    instructor: 'Sneha Rao',
    rating: 4.7,
    students: 31200,
    duration: '24 hours',
    price: 2999,
    image: 'https://images.unsplash.com/photo-1680783954745-b4a5f4c84b6c?w=400&h=250&fit=crop',
    level: 'Beginner',
    category: 'Generative AI',
  },

  // ── Cyber Security (additional) ──────────────────────────────────
  {
    id: 10,
    title: 'Digital Forensics & Incident Response',
    instructor: 'Rahul Verma',
    rating: 4.8,
    students: 5480,
    duration: '44 hours',
    price: 5199,
    image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=250&fit=crop',
    level: 'Advanced',
    category: 'Cyber Security',
  },
  {
    id: 11,
    title: 'Zero Trust Security Architecture',
    instructor: 'Meera Nair',
    rating: 4.7,
    students: 4120,
    duration: '30 hours',
    price: 3799,
    image: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=400&h=250&fit=crop',
    level: 'Intermediate',
    category: 'Cyber Security',
  },

  // ── Robotics ─────────────────────────────────────────────────────
  {
    id: 12,
    title: 'Robotics Programming with ROS 2',
    instructor: 'Dr. Kiran Kumar',
    rating: 4.9,
    students: 8900,
    duration: '56 hours',
    price: 6499,
    image: 'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=400&h=250&fit=crop',
    level: 'Intermediate',
    category: 'Robotics',
  },
  {
    id: 13,
    title: 'Autonomous Drones & Computer Vision',
    instructor: 'Vikram Singh',
    rating: 4.8,
    students: 6750,
    duration: '48 hours',
    price: 7499,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&h=250&fit=crop',
    level: 'Advanced',
    category: 'Robotics',
  },
  {
    id: 14,
    title: 'Arduino & Embedded Systems for Beginners',
    instructor: 'Anjali Das',
    rating: 4.6,
    students: 14300,
    duration: '20 hours',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1580820267682-426da823b514?w=400&h=250&fit=crop',
    level: 'Beginner',
    category: 'Robotics',
  },

  // ── Cyber Forensics ───────────────────────────────────────
  {
    id: 15,
    title: 'Cyber Forensics & Digital Investigation',
    instructor: 'Dr. Siddharth Menon',
    rating: 4.9,
    students: 7820,
    duration: '46 hours',
    price: 5799,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
    level: 'Advanced',
    category: 'Cyber Forensics',
  },
  {
    id: 16,
    title: 'Mobile Device Forensics',
    instructor: 'Kavya Reddy',
    rating: 4.7,
    students: 4650,
    duration: '32 hours',
    price: 3999,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
    level: 'Intermediate',
    category: 'Cyber Forensics',
  },
  {
    id: 17,
    title: 'Network Forensics & Packet Analysis',
    instructor: 'Arun Krishnan',
    rating: 4.8,
    students: 5310,
    duration: '38 hours',
    price: 4699,
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=250&fit=crop',
    level: 'Advanced',
    category: 'Cyber Forensics',
  },
];

const Courses = () => {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingCourse, setProcessingCourse] = useState<string | number | null>(null);
  const navigate = useNavigate();
  const { add } = useCart();

  useEffect(() => {
    let mounted = true;
    api
      .get('/courses')
      .then((data: Course[]) => {
        if (!mounted) return;
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        let msg = '';
        if (err && typeof err === 'object' && 'message' in err) {
          const m = (err as { message?: unknown }).message;
          msg = typeof m === 'string' ? m : String(m);
        } else {
          msg = String(err);
        }
        // If fetching courses fails (network/local dev), fall back to bundled courses
        setError(null);
        setCourses(FALLBACK_COURSES);
        console.warn('Failed to load courses from API, using fallback list:', msg);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const categories = [
    'All',
    'Penetration Testing',
    'Web Security',
    'Network Security',
    'Malware Analysis',
    'Bug Bounty',
    'Cloud Security',
    'Cyber Security',
    'Machine Learning',
    'Deep Learning',
    'Generative AI',
    'Robotics',
    'Cyber Forensics',
  ];

  const handleEnroll = async (courseId: string | number) => {
    try {
      setProcessingCourse(courseId);
      const courseObj = (courses || FALLBACK_COURSES).find((c) => String(c.id) === String(courseId));
      const payload = { type: 'course', id: courseId, items: courseObj ? [{ productId: courseObj.id, name: courseObj.title, price: Number(courseObj.price || 0), quantity: 1 }] : undefined };
      const res = await api.post('/checkout', payload);
      const body = res as CheckoutResponse;
      if (body && body.orderId) {
        navigate(`/checkout/status?orderId=${encodeURIComponent(body.orderId)}`);
        return;
      }
      if (body && body.url) {
        try {
          const parsed = new URL(body.url, window.location.origin);
          const oid = parsed.searchParams.get('orderId');
          if (oid) {
            navigate(`/checkout/status?orderId=${encodeURIComponent(oid)}`);
            return;
          }
        } catch (e) {
          console.warn('Failed to parse checkout URL', e);
        }
        window.location.href = body.url;
        return;
      }
      if (body && body.sessionId) {
        const pk = import.meta.env.VITE_STRIPE_PK as string | undefined;
        if (!pk) {
          navigate(`/checkout/status?session_id=${encodeURIComponent(body.sessionId)}`);
          return;
        }
        try {
          const stripeModule = await import('@stripe/stripe-js');
          const stripe = await stripeModule.loadStripe(pk);
          if (stripe) await stripe.redirectToCheckout({ sessionId: body.sessionId });
        } catch (e) {
          console.error('Stripe redirect failed', e);
          alert('Unable to redirect to Stripe checkout');
        }
      }
    } catch (err) {
      const errorMessage = (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') ? (err as { message: string }).message : String(err);
      alert(errorMessage || 'Unable to start payment');
    } finally {
      setProcessingCourse(null);
    }
  };

  if (error) return <ErrorMessage message={error} />;
  if (courses === null) return <Loading message="Loading courses..." />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore <GlowText as="span" color="gradient" animate={false}>Courses</GlowText>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn from industry experts and master cybersecurity skills with our comprehensive courses.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search courses..." className="pl-10 bg-card border-border" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" /> Filters
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category, index) => {
              const selected = index === 0;
              return (
                <button
                  key={category}
                  className={
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors ' +
                    (selected ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground')
                  }
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => {
              return (
                <div key={course.id}>
                  <GlowCard className="p-0 overflow-hidden" glowColor="blue">
                    <div className="relative">
                      <img src={course.image ?? ''} alt={course.title} className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-primary/80">{course.level}</Badge>
                      <button className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary-foreground" />
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-primary mb-2">{course.category}</p>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">by {course.instructor}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          {course.rating ?? '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {(course.students ?? 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {course.duration ?? '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">₹{(course.price ?? 0).toLocaleString()}</span>
                        <Button size="sm" variant="outline" onClick={() => add({ id: course.id, title: course.title, price: course.price ?? 0, quantity: 1 })}>
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </GlowCard>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Courses;
