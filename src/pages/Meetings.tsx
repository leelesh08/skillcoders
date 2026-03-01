import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Clock, Users, MessageCircle, ExternalLink, BookOpen, Briefcase, Plus } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowButton from '@/components/GlowButton';
import GlowText from '@/components/GlowText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MeetingScheduler from '@/components/MeetingScheduler';
import ChatRoom from '@/components/ChatRoom';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: 'class' | 'client';
  host: string;
  meetLink: string;
  participants: number;
  isEnrolled: boolean;
  isLive: boolean;
}

const upcomingMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Web Security Fundamentals',
    description: 'Learn about OWASP Top 10 vulnerabilities and how to prevent them',
    date: '2024-02-15',
    time: '10:00 AM',
    duration: '2 hours',
    type: 'class',
    host: 'Dr. Cyber Expert',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    participants: 24,
    isEnrolled: true,
    isLive: true,
  },
  {
    id: '2',
    title: 'Network Penetration Testing',
    description: 'Advanced network security testing techniques and methodologies',
    date: '2024-02-16',
    time: '2:00 PM',
    duration: '1.5 hours',
    type: 'class',
    host: 'Prof. Network Pro',
    meetLink: 'https://meet.google.com/xyz-uvwx-rst',
    participants: 18,
    isEnrolled: true,
    isLive: false,
  },
  {
    id: '3',
    title: 'Ethical Hacking Workshop',
    description: 'Hands-on ethical hacking with real-world scenarios',
    date: '2024-02-17',
    time: '11:00 AM',
    duration: '3 hours',
    type: 'class',
    host: 'Security Mentor',
    meetLink: 'https://meet.google.com/def-ghij-klm',
    participants: 32,
    isEnrolled: false,
    isLive: false,
  },
];

const clientMeetings: Meeting[] = [
  {
    id: '4',
    title: 'Security Audit - ABC Corp',
    description: 'Quarterly security assessment discussion',
    date: '2024-02-18',
    time: '3:00 PM',
    duration: '1 hour',
    type: 'client',
    host: 'Security Consultant',
    meetLink: 'https://meet.google.com/cli-ent-abc',
    participants: 5,
    isEnrolled: true,
    isLive: false,
  },
  {
    id: '5',
    title: 'Vulnerability Report Review',
    description: 'Review of penetration testing findings for XYZ Ltd',
    date: '2024-02-19',
    time: '10:30 AM',
    duration: '45 min',
    type: 'client',
    host: 'Lead Pentester',
    meetLink: 'https://meet.google.com/cli-ent-xyz',
    participants: 3,
    isEnrolled: true,
    isLive: false,
  },
];

const Meetings = () => {
  const [showScheduler, setShowScheduler] = useState(false);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [userRole] = useState<'student' | 'instructor' | 'client'>('student');

  const handleOpenChat = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setShowChatRoom(true);
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    if (!meeting.isEnrolled && userRole === 'student') {
      alert('You must be enrolled in this course to join the meeting.');
      return;
    }
    window.open(meeting.meetLink, '_blank');
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <GlowCard glowColor={meeting.type === 'class' ? 'cyan' : 'purple'}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {meeting.type === 'class' ? (
              <BookOpen className="w-5 h-5 text-primary" />
            ) : (
              <Briefcase className="w-5 h-5 text-secondary" />
            )}
            <Badge variant={meeting.type === 'class' ? 'default' : 'secondary'}>
              {meeting.type === 'class' ? 'Class' : 'Client Meeting'}
            </Badge>
            {meeting.isLive && (
              <Badge variant="destructive" className="animate-pulse">
                🔴 LIVE
              </Badge>
            )}
          </div>
          {meeting.isEnrolled && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              ✓ Enrolled
            </Badge>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">{meeting.title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{meeting.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{meeting.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{meeting.time} ({meeting.duration})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{meeting.participants} participants</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Video className="w-4 h-4 text-muted-foreground" />
            <span>Google Meet</span>
          </div>
        </div>

        <p className="text-sm mb-4">
          <span className="text-muted-foreground">Host: </span>
          <span className="text-primary font-medium">{meeting.host}</span>
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChat(meeting.id)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ask Doubts
          </Button>
          <GlowButton
            variant={meeting.isEnrolled ? 'primary' : 'secondary'}
            className="flex-1"
            onClick={() => handleJoinMeeting(meeting)}
            disabled={!meeting.isEnrolled && userRole === 'student'}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {meeting.isLive ? 'Join Now' : 'Join Meeting'}
          </GlowButton>
        </div>

        {!meeting.isEnrolled && userRole === 'student' && (
          <p className="text-xs text-destructive mt-2 text-center">
            ⚠️ Enroll in this course to join the meeting
          </p>
        )}
      </GlowCard>
    </motion.div>
  );

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
              <Video className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Virtual Classroom</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <GlowText>Meetings & Classes</GlowText>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join live classes, attend client meetings, and connect with instructors through Google Meet. 
              Chat with your teachers before class to clarify doubts.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            <GlowButton variant="primary" onClick={() => setShowScheduler(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Schedule Meeting
            </GlowButton>
            <Button variant="outline" onClick={() => setShowChatRoom(true)}>
              <MessageCircle className="w-5 h-5 mr-2" />
              Open Chat Room
            </Button>
          </motion.div>

          {/* Meetings Tabs */}
          <Tabs defaultValue="classes" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Classes ({upcomingMeetings.length})
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Client Meetings ({clientMeetings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classes">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingMeetings.map((meeting, index) => (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MeetingCard meeting={meeting} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="clients">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientMeetings.map((meeting, index) => (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MeetingCard meeting={meeting} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            <GlowCard glowColor="cyan">
              <div className="text-center">
                <Video className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Google Meet Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Seamless integration with Google Meet for high-quality video classes and meetings.
                </p>
              </div>
            </GlowCard>

            <GlowCard glowColor="purple">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pre-Class Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Ask doubts before joining class. Use study emojis 📚 to express yourself!
                </p>
              </div>
            </GlowCard>

            <GlowCard glowColor="blue">
              <div className="text-center">
                <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Group Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Create study groups with teachers, students, and clients to share knowledge.
                </p>
              </div>
            </GlowCard>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <MeetingScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        userRole={userRole}
        onOpenChat={handleOpenChat}
      />

      <ChatRoom
        isOpen={showChatRoom}
        onClose={() => setShowChatRoom(false)}
        userRole={userRole === 'instructor' ? 'teacher' : userRole === 'client' ? 'student' : userRole}
        currentUsername="CurrentUser"
        meetingId={selectedMeetingId || undefined}
      />
    </div>
  );
};

export default Meetings;
