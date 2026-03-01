import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import GlowButton from '@/components/GlowButton';
import GlowText from '@/components/GlowText';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import scLogo from '@/assets/sc_logo.png';
import { auth, signInWithGooglePopup, signInWithGoogleRedirect, signInWithGithubPopup, signInWithGithubRedirect, signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from '@/lib/firebase';

// Type declaration for recaptchaVerifier on window
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

const socialProviders = [
  {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: 'hover:bg-red-500/10 hover:border-red-500/50',
  },
  {
    name: 'LinkedIn',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: 'hover:bg-blue-600/10 hover:border-blue-600/50',
  },
  {
    name: 'GitHub',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    color: 'hover:bg-gray-500/10 hover:border-gray-500/50',
  },
];

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [verificationStep, setVerificationStep] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (authMethod === 'email') {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await cred.user.getIdToken();

        const apiUrl = import.meta.env.VITE_API_URL ?? '';
        const resp = await fetch(`${apiUrl}/verifyToken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.error || `Verification failed: ${resp.status}`);
        }

        const data = await resp.json();
        console.log('Verified token:', data);
        navigate('/');
      } catch (err: unknown) {
        console.error(err);
        let msg = 'Login failed';
        if (err && typeof err === 'object' && 'message' in err) {
          const m = (err as { message?: unknown }).message;
          msg = typeof m === 'string' ? m : String(m);
        } else {
          msg = String(err);
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Phone login
      try {
        // Setup reCAPTCHA verifier
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: string) => {
              console.log('reCAPTCHA verified:', response);
            }
          });
        }

        const appVerifier = window.recaptchaVerifier;
        const phoneNumber = phone.startsWith('+') ? phone : '+91' + phone;

        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setVerificationStep(true);
        setError(null);
      } catch (err: unknown) {
        console.error('Phone sign-in error', err);
        const code = (err as { code?: string })?.code;
        let msg = 'Failed to send verification code';
        if (code === 'auth/billing-not-enabled') {
          msg = 'Phone authentication requires a Firebase billing plan. Add a credit card in the Firebase console or use a test phone number.';
        } else if (err && typeof err === 'object' && 'message' in err) {
          const m = (err as { message?: unknown }).message;
          msg = typeof m === 'string' ? m : String(m);
        } else {
          msg = String(err);
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpVerification = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result found');
      }

      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const resp = await fetch(`${apiUrl}/verifyToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || `Verification failed: ${resp.status}`);
      }

      const data = await resp.json();
      console.log('Phone login verified:', data);
      navigate('/');
    } catch (err: unknown) {
      console.error('OTP verification error', err);
      let msg = 'Invalid verification code';
      if (err && typeof err === 'object' && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        msg = typeof m === 'string' ? m : String(m);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithGooglePopup();
      const idToken = await cred.user.getIdToken();

      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const resp = await fetch(`${apiUrl}/verifyToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || `Verification failed: ${resp.status}`);
      }

      const data = await resp.json();
      console.log('Verified token (google):', data);
      navigate('/');
    } catch (err: unknown) {
      console.error('Google sign-in error', err);
      const code = (err as { code?: string })?.code;
      // If popup was cancelled, blocked, or not supported, fallback to redirect flow
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user' || code === 'auth/popup-blocked' || code === 'auth/web-storage-unsupported') {
        try {
          console.log('Popup blocked or unsupported, using redirect flow...');
          await signInWithGoogleRedirect();
          return; // redirect will occur
        } catch (e2) {
          console.error('Redirect fallback failed', e2);
        }
      }
      let msg = 'Google sign-in failed';
      if (err && typeof err === 'object' && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        msg = typeof m === 'string' ? m : String(m);
      } else {
        msg = String(err);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithGithubPopup();
      const idToken = await cred.user.getIdToken();

      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const resp = await fetch(`${apiUrl}/verifyToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || `Verification failed: ${resp.status}`);
      }

      const data = await resp.json();
      console.log('Verified token (github):', data);
      navigate('/');
    } catch (err: unknown) {
      console.error('GitHub sign-in error', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user' || code === 'auth/popup-blocked' || code === 'auth/web-storage-unsupported') {
        try {
          await signInWithGithubRedirect();
          return;
        } catch (e2) {
          console.error('GitHub redirect fallback failed', e2);
        }
      }
      let msg = 'GitHub sign-in failed';
      if (err && typeof err === 'object' && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        msg = typeof m === 'string' ? m : String(m);
      } else {
        msg = String(err);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <ParticleBackground />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Go Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 group transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">Go Back</span>
          </motion.button>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Link to="/" className="inline-flex items-center gap-3">
              <img src={scLogo} alt="SkillCoders Logo" className="w-12 h-12 object-contain" />
              <span className="text-2xl font-bold glow-text">SkillCoders</span>
            </Link>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-8 glow-border"
          >
            {loading && (
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center z-50">
                <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin" role="status" aria-label="Loading" />
              </div>
            )}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to continue your learning journey</p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              {socialProviders.map((provider, index) => (
                <motion.button
                  key={provider.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={provider.name === 'Google' ? handleGoogleSignIn : provider.name === 'GitHub' ? handleGithubSignIn : undefined}
                  disabled={loading}
                  aria-disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-background/50 transition-all duration-300 ${provider.color} ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {provider.icon}
                  <span className="font-medium">Continue with {provider.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="relative my-6">
              <Separator className="bg-border" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-sm text-muted-foreground">
                or sign in another way
              </span>
            </div>

            {/* Email/Phone Tab */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex gap-2 mb-6 bg-background/30 p-1 rounded-lg"
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setVerificationStep(false);
                  setOtp('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${authMethod === 'email'
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setVerificationStep(false);
                  setOtp('');
                  setConfirmationResult(null);
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${authMethod === 'phone'
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </motion.div>

            {/* Email/Password Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (verificationStep) {
                handleOtpVerification();
              } else {
                handleSubmit(e);
              }
            }} className="space-y-4">
              {!verificationStep ? (
                <>
                  {authMethod === 'email' ? (
                    <>
                      {/* Email Field */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="pl-10 bg-background/50 border-border focus:border-primary"
                            required
                          />
                        </div>
                      </motion.div>

                      {/* Password Field */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-background/50 border-border focus:border-primary"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Phone Number Field */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <div className="relative mt-2">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm select-none">+91</span>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            maxLength={10}
                            className="pl-12 bg-background/50 border-border focus:border-primary"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Enter 10-digit mobile number</p>
                      </motion.div>
                    </>
                  )}

                  {/* Terms & Forgot Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: authMethod === 'email' ? 0.6 : 0.5 }}
                    className="space-y-3"
                  >
                    {authMethod === 'email' && (
                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded border-border" />
                          <span className="text-muted-foreground">Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <input type="checkbox" id="login-terms" className="mt-1 rounded border-border" required />
                      <label htmlFor="login-terms" className="text-xs text-muted-foreground">
                        By signing in, I agree to the{' '}
                        <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </label>
                    </div>
                  </motion.div>

                  {error && <p className="text-sm text-destructive mt-3">{error}</p>}

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: authMethod === 'email' ? 0.7 : 0.6 }}
                  >
                    <GlowButton type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                      <span className="flex items-center justify-center gap-2">
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </GlowButton>
                  </motion.div>
                </>
              ) : (
                /* OTP Verification Step */
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                  >
                    <h2 className="text-2xl font-bold mb-2">Verify Phone Number</h2>
                    <p className="text-muted-foreground">
                      Enter the 6-digit code sent to +91{phone}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="mt-2 text-center text-2xl tracking-widest bg-background/50 border-border focus:border-primary"
                    />
                  </motion.div>

                  {error && <p className="text-sm text-destructive mt-3">{error}</p>}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <GlowButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={loading || otp.length !== 6}
                      type="submit"
                    >
                      Verify & Sign In
                    </GlowButton>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    type="button"
                    onClick={() => {
                      setVerificationStep(false);
                      setOtp('');
                      setError(null);
                      setConfirmationResult(null);
                    }}
                    className="w-full text-center text-sm text-primary hover:underline mt-4"
                  >
                    Change phone number
                  </motion.button>
                </>
              )}

            </form>

            {/* reCAPTCHA Container */}
            <div id="recaptcha-container" className="mt-4" />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6 text-muted-foreground"
            >
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up free
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
