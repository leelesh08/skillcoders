import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Users, Trophy, Clock, Shield, Play, IndianRupee } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowButton from '@/components/GlowButton';
import GlowText from '@/components/GlowText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BattleData {
  id: number;
  title: string;
  redTeam: { name: string; score: number; members: number };
  blueTeam: { name: string; score: number; members: number };
  prize: number;
  entryFee: number;
  timeLeft: string;
  viewers: number;
  status: string;
}

const activeBattlesConst: BattleData[] = [
  {
    id: 1,
    title: 'Web App Siege',
    redTeam: { name: 'Crimson Hackers', score: 2450, members: 12 },
    blueTeam: { name: 'Azure Defenders', score: 2380, members: 12 },
    prize: 25000,
    entryFee: 50,
    timeLeft: '2:34:12',
    viewers: 1247,
    status: 'live',
  },
  {
    id: 2,
    title: 'Network Warfare',
    redTeam: { name: 'Red Storm', score: 1890, members: 8 },
    blueTeam: { name: 'Blue Shield', score: 1920, members: 8 },
    prize: 15000,
    entryFee: 50,
    timeLeft: '1:15:45',
    viewers: 856,
    status: 'live',
  },
];

const upcomingBattlesConst = [
  {
    id: 3,
    title: 'CTF Championship',
    startTime: '2024-02-15 18:00',
    prize: 50000,
    entryFee: 100,
    maxParticipants: 50,
    registered: 38,
  },
  {
    id: 4,
    title: 'Malware Mayhem',
    startTime: '2024-02-16 20:00',
    prize: 30000,
    entryFee: 75,
    maxParticipants: 32,
    registered: 24,
  },
];

const Battle = () => {
  // Track team selection per battle separately
  const [selectedTeams, setSelectedTeams] = useState<Record<number, 'red' | 'blue' | null>>({});
  const [bidAmount, setBidAmount] = useState(50);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<BattleData | null>(null);
  const [activeBattles, setActiveBattles] = useState<BattleData[]>(activeBattlesConst);
  const [upcomingBattles, setUpcomingBattles] = useState(upcomingBattlesConst);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([api.get('/battles/active').catch(() => null), api.get('/battles/upcoming').catch(() => null)])
      .then(([active, upcoming]) => {
        if (!mounted) return;
        if (Array.isArray(active)) setActiveBattles(active);
        if (Array.isArray(upcoming)) setUpcomingBattles(upcoming);
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

  if (loading) return <Loading message="Loading battles..." />;
  if (error) return <ErrorMessage message={error} />;

  const handleSelectTeam = (battleId: number, team: 'red' | 'blue') => {
    setSelectedTeams(prev => ({
      ...prev,
      [battleId]: prev[battleId] === team ? null : team,
    }));
  };

  const handleJoinBattle = (battle: BattleData) => {
    if (!selectedTeams[battle.id]) {
      alert('Please select a team (Red or Blue) before joining!');
      return;
    }
    setSelectedBattle(battle);
    setShowJoinDialog(true);
  };

  const handleConfirmJoin = () => {
    if (selectedBattle && selectedTeams[selectedBattle.id]) {
      console.log(`Joining ${selectedBattle.title} as ${selectedTeams[selectedBattle.id]} team with bid ₹${bidAmount}`);
      // Here you would integrate with payment and streaming
      setShowJoinDialog(false);
      setBidAmount(50);
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 mb-4">
              <Swords className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">Live Battles</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <GlowText as="span" color="purple" animate={false}>Red</GlowText>
              {' vs '}
              <GlowText as="span" color="blue" animate={false}>Blue</GlowText>
              {' Battle Arena'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join live cybersecurity battles, compete in teams, and win prizes. 
              Bid from ₹50 to ₹1,00,000 per battle!
            </p>
          </motion.div>

          {/* Active Battles */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              Live Battles
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {loading ? (
                <></>
              ) : null}
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i}><Skeleton className="h-48 w-full rounded-lg" /></div>
                ))
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                activeBattles.map((battle, index) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard className="p-0 overflow-hidden" glowColor="purple">
                    {/* Battle Header */}
                    <div className="p-6 bg-gradient-to-r from-destructive/10 via-transparent to-primary/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="animate-pulse">
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3 fill-current" />
                              LIVE
                            </span>
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            {battle.viewers.toLocaleString()} watching
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-primary">{battle.timeLeft}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-4">{battle.title}</h3>

                      {/* Teams vs - SEPARATE SELECTION PER BATTLE */}
                      <div className="grid grid-cols-3 items-center gap-4">
                        {/* Red Team */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleSelectTeam(battle.id, 'red')}
                          className={`p-4 rounded-xl cursor-pointer transition-all ${
                            selectedTeams[battle.id] === 'red' 
                              ? 'bg-destructive/20 border-2 border-destructive shadow-[0_0_20px_hsl(var(--destructive)/0.4)]' 
                              : 'bg-destructive/10 border border-destructive/30 hover:border-destructive/60'
                          }`}
                        >
                          <div className="text-center">
                            <Shield className="w-8 h-8 text-destructive mx-auto mb-2" />
                            <p className="font-semibold text-sm">{battle.redTeam.name}</p>
                            <p className="text-2xl font-bold text-destructive">{battle.redTeam.score}</p>
                            <p className="text-xs text-muted-foreground">
                              {battle.redTeam.members} members
                            </p>
                            {selectedTeams[battle.id] === 'red' && (
                              <Badge className="mt-2 bg-destructive text-destructive-foreground">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </motion.div>

                        {/* VS */}
                        <div className="text-center">
                          <div className="relative">
                            <Swords className="w-12 h-12 mx-auto text-muted-foreground" />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <span className="text-2xl font-bold">VS</span>
                            </motion.div>
                          </div>
                        </div>

                        {/* Blue Team */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleSelectTeam(battle.id, 'blue')}
                          className={`p-4 rounded-xl cursor-pointer transition-all ${
                            selectedTeams[battle.id] === 'blue' 
                              ? 'bg-primary/20 border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]' 
                              : 'bg-primary/10 border border-primary/30 hover:border-primary/60'
                          }`}
                        >
                          <div className="text-center">
                            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="font-semibold text-sm">{battle.blueTeam.name}</p>
                            <p className="text-2xl font-bold text-primary">{battle.blueTeam.score}</p>
                            <p className="text-xs text-muted-foreground">
                              {battle.blueTeam.members} members
                            </p>
                            {selectedTeams[battle.id] === 'blue' && (
                              <Badge className="mt-2 bg-primary text-primary-foreground">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Battle Footer */}
                    <div className="p-6 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Prize Pool</p>
                          <p className="text-lg font-bold text-yellow-500 flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            ₹{battle.prize.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Min Entry</p>
                          <p className="text-lg font-bold text-primary flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {battle.entryFee}
                          </p>
                        </div>
                      </div>
                      <GlowButton 
                        variant="primary"
                        onClick={() => handleJoinBattle(battle)}
                      >
                        Join Battle
                      </GlowButton>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Upcoming Battles */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Upcoming Battles
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i}><Skeleton className="h-40 w-full rounded-lg" /></div>
                ))
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                upcomingBattles.map((battle, index) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <GlowCard glowColor="cyan">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{battle.title}</h3>
                        <p className="text-sm text-muted-foreground">{battle.startTime}</p>
                      </div>
                      <Badge variant="outline" className="border-primary text-primary">
                        Upcoming
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registered</span>
                        <span>{battle.registered}/{battle.maxParticipants}</span>
                      </div>
                      <Progress value={(battle.registered / battle.maxParticipants) * 100} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Prize</p>
                          <p className="font-bold text-yellow-500">₹{battle.prize.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Entry</p>
                          <p className="font-bold text-primary">₹{battle.entryFee}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Register
                      </Button>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Join Battle Dialog with Bid Customization */}
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">
                  Join <span className="text-primary">{selectedBattle?.title}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Selected Team Display */}
                {selectedBattle && selectedTeams[selectedBattle.id] && (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">You are joining as:</p>
                    <Badge 
                      className={`text-lg px-4 py-2 ${
                        selectedTeams[selectedBattle.id] === 'red' 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      {selectedTeams[selectedBattle.id] === 'red' 
                        ? selectedBattle.redTeam.name 
                        : selectedBattle.blueTeam.name}
                    </Badge>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Set your bid amount (₹50 - ₹1,00,000)
                  </p>
                  <div className="text-4xl font-bold text-primary mb-2">
                    ₹{bidAmount.toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Min: ₹50</span>
                    <span>Max: ₹1,00,000</span>
                  </div>
                  <Slider
                    value={[bidAmount]}
                    onValueChange={(value) => setBidAmount(value[0])}
                    min={50}
                    max={100000}
                    step={50}
                    className="w-full"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setBidAmount(amount)}
                        className={bidAmount === amount ? 'border-primary text-primary' : ''}
                      >
                        ₹{amount}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[10000, 25000, 50000, 100000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setBidAmount(amount)}
                        className={bidAmount === amount ? 'border-primary text-primary' : ''}
                      >
                        ₹{(amount / 1000).toFixed(0)}K
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bid Amount</span>
                    <span>₹{bidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (5%)</span>
                    <span>₹{(bidAmount * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">₹{(bidAmount * 1.05).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <GlowButton variant="primary" className="flex-1" onClick={handleConfirmJoin}>
                    Confirm & Pay
                  </GlowButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Battle;
