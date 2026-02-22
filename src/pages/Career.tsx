import { useState, useEffect } from 'react';
 import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
 import { Users, Briefcase, Clock, DollarSign, Star, ArrowRight, CheckCircle, GraduationCap, TrendingUp, Calendar, Send } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
 import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowText from '@/components/GlowText';
import GlowButton from '@/components/GlowButton';
import { Badge } from '@/components/ui/badge';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const instructorsConst = [
  {
    id: 1,
    name: 'Alex Security',
    title: 'Senior Penetration Tester',
    avatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5.0,
    reviews: 2456,
    students: 12450,
    courses: 24,
    specialization: 'Ethical Hacking',
    available: true,
  },
  {
    id: 2,
    name: 'Sarah White',
    title: 'Web Security Expert',
    avatar: 'https://i.pravatar.cc/150?img=5',
    rating: 4.9,
    reviews: 1892,
    students: 8920,
    courses: 18,
    specialization: 'Web Application Security',
    available: true,
  },
  {
    id: 3,
    name: 'Mike Chen',
    title: 'Network Security Analyst',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 4.8,
    reviews: 1567,
    students: 15670,
    courses: 15,
    specialization: 'Network Security',
    available: false,
  },
  {
    id: 4,
    name: 'Lisa Hunt',
    title: 'Bug Bounty Hunter',
    avatar: 'https://i.pravatar.cc/150?img=9',
    rating: 4.9,
    reviews: 2134,
    students: 9870,
    courses: 12,
    specialization: 'Bug Bounty',
    available: true,
  },
];

const benefitsConst = [
  { icon: DollarSign, title: 'Competitive Earnings', description: 'Earn up to ₹1,50,000+ per month' },
  { icon: Clock, title: 'Flexible Hours', description: 'Work part-time or full-time, your choice' },
  { icon: Users, title: 'Unlimited Students', description: 'No limit on how many students you can teach' },
  { icon: TrendingUp, title: 'Growth Platform', description: 'Build your personal brand and reputation' },
];

const internshipsConst = [
   {
     id: 1,
     title: 'Frontend Development Intern',
     duration: '3 months',
     stipend: '₹10,000 - ₹15,000/month',
     skills: ['React', 'TypeScript', 'Tailwind CSS'],
     spots: 5,
   },
   {
     id: 2,
     title: 'Backend Development Intern',
     duration: '3 months',
     stipend: '₹12,000 - ₹18,000/month',
     skills: ['Node.js', 'PostgreSQL', 'REST APIs'],
     spots: 3,
   },
   {
     id: 3,
     title: 'Cybersecurity Intern',
     duration: '6 months',
     stipend: '₹15,000 - ₹25,000/month',
     skills: ['Penetration Testing', 'Network Security', 'OWASP'],
     spots: 2,
   },
   {
     id: 4,
     title: 'Full Stack Development Intern',
     duration: '4 months',
     stipend: '₹15,000 - ₹20,000/month',
     skills: ['React', 'Node.js', 'MongoDB'],
     spots: 4,
   },
 ];
 
const Career = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
     name: '',
     email: '',
     phone: '',
     position: '',
     message: '',
   });
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     console.log('Form submitted:', formData);
     toast({
       title: 'Application Submitted!',
       description: 'We will contact you soon at ' + formData.email,
     });
     setFormData({ name: '', email: '', phone: '', position: '', message: '' });
   };
 
  const [instructors, setInstructors] = useState(instructorsConst);
  const [internships, setInternships] = useState(internshipsConst);
  const [benefits, setBenefits] = useState(benefitsConst);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([api.get('/instructors').catch(() => null), api.get('/internships').catch(() => null), api.get('/career-benefits').catch(() => null)])
      .then(([inst, intern, ben]) => {
        if (!mounted) return;
        if (Array.isArray(inst)) setInstructors(inst);
        if (Array.isArray(intern)) setInternships(intern);
        if (Array.isArray(ben)) setBenefits(ben);
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

  if (loading) return <Loading message="Loading career data..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-4">
              <Briefcase className="w-4 h-4 text-secondary" />
              <span className="text-sm text-secondary font-medium">Career Opportunities</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join as an{' '}
              <GlowText as="span" color="purple" animate={false}>
                Instructor
              </GlowText>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Share your cybersecurity expertise with thousands of students. 
              Part-time or full-time opportunities available.
            </p>
            <Link to="/instructor-apply">
              <GlowButton variant="secondary" size="lg">
                <span className="flex items-center gap-2">
                  Apply as Instructor
                  <ArrowRight className="w-5 h-5" />
                </span>
              </GlowButton>
            </Link>
          </motion.div>

          {/* Benefits */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Why Become an Instructor?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}><Skeleton className="h-36 w-full rounded-lg" /></div>
                ))
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : (
                benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <GlowCard glowColor="purple">
                      <benefit.icon className="w-10 h-10 text-secondary mb-4" />
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </GlowCard>
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>

          {/* Work Types */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Choose Your Path</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <GlowCard glowColor="blue" className="text-center">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Part-Time Instructor</h3>
                <p className="text-muted-foreground mb-4">
                  Work on your schedule. Perfect for professionals who want to teach alongside their day job.
                </p>
                <ul className="text-left space-y-2 mb-6">
                  {['10-20 hours per week', 'Create courses at your pace', 'Flexible class timings', 'Minimum ₹30,000/month'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/instructor-apply">
                  <GlowButton variant="outline" className="w-full">
                    Apply Part-Time
                  </GlowButton>
                </Link>
              </GlowCard>

              <GlowCard glowColor="purple" className="text-center">
                <Briefcase className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Full-Time Instructor</h3>
                <p className="text-muted-foreground mb-4">
                  Dedicate yourself to teaching. Maximum earning potential with full platform benefits.
                </p>
                <ul className="text-left space-y-2 mb-6">
                  {['40+ hours per week', 'Priority course placement', 'Premium support', 'Up to ₹1,50,000+/month'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/instructor-apply">
                  <GlowButton variant="secondary" className="w-full">
                    Apply Full-Time
                  </GlowButton>
                </Link>
              </GlowCard>
            </div>
          </motion.section>

         {/* Internship Section */}
         <motion.section
           id="internship"
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.25 }}
           className="mb-16"
         >
           <div className="text-center mb-8">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
               <GraduationCap className="w-4 h-4 text-primary" />
               <span className="text-sm text-primary font-medium">Internship Program</span>
             </div>
             <h2 className="text-2xl font-bold mb-2">
               Launch Your Career with{' '}
               <GlowText as="span" color="blue" animate={false}>
                 Internships
               </GlowText>
             </h2>
             <p className="text-muted-foreground">
               Gain real-world experience with our structured internship programs
             </p>
           </div>
 
           <div className="grid md:grid-cols-2 gap-6">
             {loading ? (
               Array.from({ length: 2 }).map((_, i) => (
                 <div key={i}><Skeleton className="h-40 w-full rounded-lg" /></div>
               ))
             ) : error ? (
               <div className="text-center text-red-500">{error}</div>
             ) : (
               internships.map((internship, index) => (
                 <motion.div
                   key={internship.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 + index * 0.1 }}
                 >
                   <GlowCard glowColor="cyan">
                     <div className="flex items-start justify-between mb-4">
                       <div>
                         <h3 className="font-semibold text-lg">{internship.title}</h3>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                           <Calendar className="w-4 h-4" />
                           {internship.duration}
                         </div>
                       </div>
                       <Badge variant="outline" className="border-primary/50 text-primary">
                         {internship.spots} spots left
                       </Badge>
                     </div>
                     
                     <p className="text-primary font-semibold mb-3">{internship.stipend}</p>
                     
                     <div className="flex flex-wrap gap-2 mb-4">
                       {internship.skills.map((skill) => (
                         <Badge key={skill} variant="secondary" className="text-xs">
                           {skill}
                         </Badge>
                       ))}
                     </div>
                     
                     <GlowButton variant="outline" size="sm" className="w-full">
                       Apply Now
                     </GlowButton>
                   </GlowCard>
                 </motion.div>
               ))
             )}
           </div>
         </motion.section>
 
         {/* Application Form */}
         <motion.section
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.35 }}
           className="mb-16"
         >
           <GlowCard glowColor="purple" className="max-w-2xl mx-auto">
             <div className="text-center mb-6">
               <h2 className="text-2xl font-bold mb-2">Apply Now</h2>
               <p className="text-muted-foreground">
                 Submit your application and join our team
               </p>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium mb-2 block">Full Name</label>
                   <Input
                     placeholder="John Doe"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     required
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium mb-2 block">Email</label>
                   <Input
                     type="email"
                     placeholder="john@example.com"
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     required
                   />
                 </div>
               </div>
               
               <div className="grid md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium mb-2 block">Phone</label>
                   <Input
                     placeholder="+91 9876543210"
                     value={formData.phone}
                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                     required
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium mb-2 block">Position</label>
                   <Input
                     placeholder="Frontend Developer / Instructor"
                     value={formData.position}
                     onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                     required
                   />
                 </div>
               </div>
               
               <div>
                 <label className="text-sm font-medium mb-2 block">Message</label>
                 <Textarea
                   placeholder="Tell us about yourself and why you want to join..."
                   rows={4}
                   value={formData.message}
                   onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                   required
                 />
               </div>
               
               <GlowButton type="submit" variant="secondary" className="w-full">
                 <span className="flex items-center gap-2">
                   <Send className="w-4 h-4" />
                   Submit Application
                 </span>
               </GlowButton>
             </form>
           </GlowCard>
         </motion.section>
 
          {/* Top Instructors */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-center mb-2">Top Instructors</h2>
            <p className="text-muted-foreground text-center mb-8">
              Book a session with our expert instructors
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {instructors.map((instructor, index) => (
                <motion.div
                  key={instructor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <GlowCard glowColor="blue">
                    <div className="text-center mb-4">
                      <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-primary">
                        <AvatarImage src={instructor.avatar} alt={instructor.name} />
                        <AvatarFallback>{instructor.name[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold">{instructor.name}</h3>
                      <p className="text-sm text-muted-foreground">{instructor.title}</p>
                      <Badge variant="outline" className="mt-2 border-primary/50 text-primary">
                        {instructor.specialization}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(instructor.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`} 
                        />
                      ))}
                      <span className="text-sm ml-1">
                        {instructor.rating} ({instructor.reviews.toLocaleString()})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-sm mb-4">
                      <div className="bg-background/50 rounded-lg p-2">
                        <p className="font-semibold">{instructor.students.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-2">
                        <p className="font-semibold">{instructor.courses}</p>
                        <p className="text-xs text-muted-foreground">Courses</p>
                      </div>
                    </div>

                    <GlowButton 
                      variant={instructor.available ? 'primary' : 'outline'} 
                      size="sm"
                      className="w-full"
                      disabled={!instructor.available}
                    >
                      {instructor.available ? 'Book Session' : 'Not Available'}
                    </GlowButton>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
     <Footer />
    </div>
  );
};

export default Career;
