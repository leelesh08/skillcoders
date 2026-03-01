import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Users, Plus, Settings, AlertTriangle, Smile } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Study-related emojis
const studyEmojis = ['📚', '✏️', '📖', '🎓', '💡', '🧠', '📝', '🔬', '💻', '🖥️', '⌨️', '🔐', '🛡️', '🔒', '🌐', '📊', '📈', '🎯', '✅', '❓', '❗', '👍', '👎', '🤔', '💪', '🙏', '👏', '🎉', '⭐', '🔥'];

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  role: 'student' | 'teacher' | 'client';
}

interface ChatGroup {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  type: 'class' | 'doubt' | 'general';
}

interface ChatRoomProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'student' | 'teacher';
  currentUsername?: string;
  meetingId?: string;
}

// Patterns to detect and block phone numbers and social media
const restrictedPatterns = [
  // Phone numbers in various formats
  /\b\d{10,}\b/g, // 10+ digits
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // xxx-xxx-xxxx
  /\+\d{1,3}[-.\s]?\d{6,14}\b/g, // International format
  /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g, // (xxx) xxx-xxxx
  // Written numbers
  /\b(zero|one|two|three|four|five|six|seven|eight|nine)\b.*\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi,
  // Social media patterns
  /@\w{3,}/g, // @username
  /instagram\s*[:.]?\s*\w+/gi,
  /facebook\s*[:.]?\s*\w+/gi,
  /twitter\s*[:.]?\s*\w+/gi,
  /snapchat\s*[:.]?\s*\w+/gi,
  /whatsapp\s*[:.]?\s*\w+/gi,
  /telegram\s*[:.]?\s*\w+/gi,
  /discord\s*[:.]?\s*\w+/gi,
  /linkedin\s*[:.]?\s*\w+/gi,
  /tiktok\s*[:.]?\s*\w+/gi,
  /youtube\s*[:.]?\s*\w+/gi,
  // Email patterns
  /\b[\w.-]+@[\w.-]+\.\w+\b/gi,
  // Symbolic number representations
  /[oO0][nN1][eE3]\s*[tT7][wW][oO0]/gi,
  /\b(o|O|0|zero)\s*(n|N|1|one)\s*(e|E|3|three)/gi,
];

const containsRestrictedContent = (text: string): boolean => {
  return restrictedPatterns.some(pattern => pattern.test(text));
};

const sampleMessages: Message[] = [
  {
    id: '1',
    userId: 'teacher1',
    username: 'Dr.CyberExpert',
    content: '📚 Welcome to the pre-class discussion! Feel free to ask your doubts.',
    timestamp: new Date(Date.now() - 300000),
    role: 'teacher',
  },
  {
    id: '2',
    userId: 'student1',
    username: 'HackerLearner',
    content: '🤔 Sir, can you explain SQL injection in more detail today?',
    timestamp: new Date(Date.now() - 240000),
    role: 'student',
  },
  {
    id: '3',
    userId: 'teacher1',
    username: 'Dr.CyberExpert',
    content: '💡 Great question! We will cover that with practical examples.',
    timestamp: new Date(Date.now() - 180000),
    role: 'teacher',
  },
];

const sampleGroups: ChatGroup[] = [
  { id: '1', name: 'Web Security Class', members: ['teacher1', 'student1', 'student2'], createdBy: 'teacher1', type: 'class' },
  { id: '2', name: 'Network Security Doubts', members: ['teacher2', 'student1', 'student3'], createdBy: 'teacher2', type: 'doubt' },
  { id: '3', name: 'General Discussion', members: ['student1', 'student2', 'student3'], createdBy: 'student1', type: 'general' },
];

const ChatRoom = ({ isOpen, onClose, userRole = 'student', currentUsername = 'CurrentUser', meetingId }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [newMessage, setNewMessage] = useState('');
  const [groups] = useState<ChatGroup[]>(sampleGroups);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(sampleGroups[0]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Check for restricted content (students only)
    if (userRole === 'student' && containsRestrictedContent(newMessage)) {
      setWarningMessage('⚠️ Phone numbers, social media handles, and email addresses are not allowed for security reasons.');
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      userId: 'currentUser',
      username: currentUsername,
      content: newMessage,
      timestamp: new Date(),
      role: userRole as 'student' | 'teacher' | 'client',
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-primary text-primary-foreground';
      case 'client': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>Chat Room</span>
            {meetingId && <Badge variant="outline">Meeting: {meetingId}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Groups Sidebar */}
          <div className="w-64 border-r border-border bg-card/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Groups</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="space-y-2">
                {groups.map((group) => (
                  <motion.button
                    key={group.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-primary/20 border border-primary/50'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {group.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.members.length} members
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            {selectedGroup && (
              <div className="p-3 border-b border-border bg-card/30 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{selectedGroup.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedGroup.members.length} members
                  </p>
                </div>
                <Button size="icon" variant="ghost">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex gap-3 ${
                      message.userId === 'currentUser' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`flex-1 max-w-[70%] ${
                      message.userId === 'currentUser' ? 'ml-auto' : ''
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.username}</span>
                        <Badge className={`text-xs ${getRoleBadgeColor(message.role)}`}>
                          {message.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.userId === 'currentUser'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Warning Message */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/50 rounded-lg flex items-center gap-2 text-destructive"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">{warningMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card/30">
              <div className="flex items-center gap-2">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="grid grid-cols-6 gap-2">
                      {studyEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="text-xl hover:bg-muted p-1 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Only usernames visible)"
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              {userRole === 'student' && (
                <p className="text-xs text-muted-foreground mt-2">
                  🔒 Phone numbers and social media handles are restricted for your safety.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRoom;
