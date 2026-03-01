import { useEffect, useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/firebase';

interface BattleData {
  id: number;
  title: string;
  redTeam: { name: string; score: number; members: number };
  blueTeam: { name: string; score: number; members: number };
  prize: number;
  entryFee: number;
  // following fields are only used for live-streamed battles and may be absent
  timeLeft?: string;
  viewers?: number;
  status?: string;
}

// sample battles - these could eventually be loaded from the server
const activeBattles: BattleData[] = [
  {
    id: 1,
    title: 'Web App Siege',
    redTeam: { name: 'Crimson Hackers', score: 2450, members: 12 },
    blueTeam: { name: 'Azure Defenders', score: 2380, members: 12 },
    prize: 25000,
    entryFee: 50,
    // time/viewer/status removed since battles are no longer live-streamed
  },
  {
    id: 2,
    title: 'Network Warfare',
    redTeam: { name: 'Red Storm', score: 1890, members: 8 },
    blueTeam: { name: 'Blue Shield', score: 1920, members: 8 },
    prize: 15000,
    entryFee: 50,
  },
];

const upcomingBattles = [
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
  // make battles stateful so we can simulate score changes
  const [battles, setBattles] = useState<BattleData[]>(activeBattles);

  // Track team selection per battle separately
  const [selectedTeams, setSelectedTeams] = useState<Record<number, 'red' | 'blue' | null>>({});
  const [bidAmount, setBidAmount] = useState(50);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<BattleData | null>(null);
  const [groupName, setGroupName] = useState('');
  type JoinedInfo = { orderId: string; team?: string; amount?: number; groupName?: string };
  const [joinedOrders, setJoinedOrders] = useState<Record<number, JoinedInfo>>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('joinedBattles') : null;
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('joinedBattles', JSON.stringify(joinedOrders));
      }
    } catch (e) {
      console.warn('Failed to persist joined battles', e);
    }
  }, [joinedOrders]);

  // helper to update a battle's score after an action
  const simulateAction = (battleId: number, action: 'attack' | 'defend') => {
    setBattles(prev =>
      prev.map(b => {
        if (b.id !== battleId) return b;
        const delta = Math.floor(Math.random() * 100) + 50;
        if (action === 'attack') {
          b.redTeam.score += delta;
          // defensive resistance
          b.blueTeam.score = Math.max(0, b.blueTeam.score - Math.floor(delta / 4));
        } else {
          b.blueTeam.score += delta;
          b.redTeam.score = Math.max(0, b.redTeam.score - Math.floor(delta / 4));
        }
        return { ...b };
      })
    );
  };

  // check win condition and optionally certificate
  const checkForVictory = (battle: BattleData) => {
    const diff = Math.abs(battle.redTeam.score - battle.blueTeam.score);
    if (diff > 1000) {
      alert(`Battle "${battle.title}" ended! ${battle.redTeam.score > battle.blueTeam.score ? 'Red' : 'Blue'} team wins. Certificate generated.`);
    }
  };

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
    setGroupName('');
    setSelectedBattle(battle);
    setShowJoinDialog(true);
  };

  const handleConfirmJoin = async () => {
    if (selectedBattle && selectedTeams[selectedBattle.id]) {
      console.log(`Joining ${selectedBattle.title} as ${selectedTeams[selectedBattle.id]} team with bid ₹${bidAmount}`);
      // Attempt to notify backend and create checkout
      try {
        const user = await getCurrentUser();
        const userId = user?.uid ?? 'anonymous';
        const email = user?.email;
        await api.post(`/battles/${selectedBattle.id}/join`, { userId, email }).catch(() => null);
        const payload = { type: 'battle', id: selectedBattle.id, amount: bidAmount, team: selectedTeams[selectedBattle.id], userId, email, groupName };
        const res = await api.post('/checkout', payload).catch(() => null) as { orderId?: string; url?: string; sessionId?: string } | null;
        if (res) {
          setJoinedOrders(prev => ({
            ...prev,
            [selectedBattle.id]: {
              orderId: res.orderId || prev[selectedBattle.id]?.orderId || '',
              team: selectedTeams[selectedBattle.id] ?? undefined,
              amount: bidAmount,
              groupName,
            },
          }));
          if (res.orderId) {
            // navigate to checkout status if present (frontend handles this route)
            window.location.href = `/checkout/status?orderId=${encodeURIComponent(res.orderId)}`;
            return;
          }
        }
        if (res && res.url) {
          window.location.href = res.url;
          return;
        }
        if (res && res.sessionId) {
          // if session-only response, store mapping if the server also returned an orderId earlier
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
      } catch (e) {
        console.error('Join failed', e);
        alert('Failed to join battle');
      } finally {
        setShowJoinDialog(false);
        setBidAmount(50);
      }
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
              <span className="text-sm text-destructive font-medium">Battles</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <GlowText as="span" color="purple" animate={false}>Red</GlowText>
              {' vs '}
              <GlowText as="span" color="blue" animate={false}>Blue</GlowText>
              {' Battle Arena'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Play online team-based cybersecurity battles, attack or defend, and win prizes.
              Bid from ₹50 to ₹1,00,000 per battle!
            </p>
          </motion.div>

          {/* Active Battles */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              Battles
            </h2>

            <div className="grid lg:grid-cols-2 gap-6">
              {battles.map((battle, index) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard className="p-0 overflow-hidden" glowColor="purple">
                    {/* Battle Header */}
                    <div className="p-6 bg-gradient-to-r from-destructive/10 via-transparent to-primary/10">
                      {/* Battle title */}
                      <h3 className="text-xl font-bold mb-4">{battle.title}</h3>
                      {joinedOrders[battle.id]?.groupName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Group: <span className="font-semibold">{joinedOrders[battle.id].groupName}</span>
                        </p>
                      )}

                      {/* Teams vs - SEPARATE SELECTION PER BATTLE */}
                      <div className="grid grid-cols-3 items-center gap-4">
                        {/* Red Team */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleSelectTeam(battle.id, 'red')}
                          className={`p-4 rounded-xl cursor-pointer transition-all ${selectedTeams[battle.id] === 'red'
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
                          className={`p-4 rounded-xl cursor-pointer transition-all ${selectedTeams[battle.id] === 'blue'
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
                      {joinedOrders[battle.id] ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Button size="sm" variant="ghost" onClick={() => { window.location.href = `/checkout/status?orderId=${encodeURIComponent(joinedOrders[battle.id].orderId)}`; }}>
                              View Status
                            </Button>
                          </div>
                          {/* action buttons when participant has joined */}
                          {joinedOrders[battle.id].team === 'red' && (
                            <GlowButton variant="outline" size="sm" onClick={() => { simulateAction(battle.id, 'attack'); const b = battles.find(b => b.id === battle.id); if (b) checkForVictory(b); }}>
                              Attack
                            </GlowButton>
                          )}
                          {joinedOrders[battle.id].team === 'blue' && (
                            <GlowButton variant="outline" size="sm" onClick={() => { simulateAction(battle.id, 'defend'); const b = battles.find(b => b.id === battle.id); if (b) checkForVictory(b); }}>
                              Defend
                            </GlowButton>
                          )}
                        </div>
                      ) : (
                        <GlowButton
                          variant="primary"
                          onClick={() => handleJoinBattle(battle)}
                        >
                          Join Battle
                        </GlowButton>
                      )}
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
              {upcomingBattles.map((battle, index) => (
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
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground mb-2">You are joining as:</p>
                    <Badge
                      className={`text-lg px-4 py-2 ${selectedTeams[selectedBattle.id] === 'red'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-primary text-primary-foreground'
                        }`}
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      {selectedTeams[selectedBattle.id] === 'red'
                        ? selectedBattle.redTeam.name
                        : selectedBattle.blueTeam.name}
                    </Badge>
                    <input
                      type="text"
                      placeholder="Group name (optional)"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      className="w-full border border-border rounded px-3 py-2 mt-2"
                    />
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
