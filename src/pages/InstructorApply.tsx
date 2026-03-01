import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Phone, BookOpen, Award, Calendar,
  DollarSign, Camera, FileText, Shield, Send, CheckCircle, Upload
} from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowButton from '@/components/GlowButton';
import GlowText from '@/components/GlowText';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const expertiseOptions = [
  'Ethical Hacking', 'Web Security', 'Network Security', 'Cloud Security',
  'Malware Analysis', 'Digital Forensics', 'Penetration Testing', 'OSINT',
  'Cryptography', 'IoT Security', 'Mobile Security', 'DevSecOps',
];

const availabilitySlots = [
  'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
  'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings',
];

const InstructorApply = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  type FormData = {
    fullName: string;
    email: string;
    phone: string;
    bio: string;
    qualifications: string;
    experience: string;
    selectedExpertise: string[];
    courseTopics: string;
    availability: string[];
    workType: 'part-time' | 'full-time' | '';
    paymentMethod: string;
    bankName: string;
    accountNumber: string;
    upiId: string;
    idType: string;
    idNumber: string;
    agreeTerms: boolean;
    agreeCode: boolean;
  };

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    qualifications: '',
    experience: '',
    selectedExpertise: [],
    courseTopics: '',
    availability: [],
    workType: '',
    paymentMethod: '',
    bankName: '',
    accountNumber: '',
    upiId: '',
    idType: '',
    idNumber: '',
    agreeTerms: false,
    agreeCode: false,
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value } as FormData));
  };

  const toggleExpertise = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      selectedExpertise: prev.selectedExpertise.includes(topic)
        ? prev.selectedExpertise.filter(t => t !== topic)
        : [...prev.selectedExpertise, topic],
    }));
  };

  const toggleAvailability = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(slot)
        ? prev.availability.filter(s => s !== slot)
        : [...prev.availability, slot],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.fullName && formData.email && formData.phone && formData.bio;
      case 2: return formData.qualifications && formData.selectedExpertise.length > 0;
      case 3: return formData.availability.length > 0 && formData.workType;
      case 4: return formData.agreeTerms && formData.agreeCode;
      default: return false;
    }
  };

  const handleSubmit = () => {
    // submit to backend
    api.post('/instructor-applications', formData)
      .then(() => {
        toast({
          title: '🎉 Application Submitted!',
          description: 'Our team will review your application and contact you within 48 hours.',
        });
        navigate('/career');
      })
      .catch((err) => {
        toast({
          title: 'Submission Failed',
          description: err?.message || 'Unable to submit application. Please try again later.',
        });
      });
  };

  const stepInfo = [
    { num: 1, label: 'Personal Info', icon: User },
    { num: 2, label: 'Expertise', icon: BookOpen },
    { num: 3, label: 'Schedule & Pay', icon: Calendar },
    { num: 4, label: 'Verification', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Go Back */}
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

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Join as an{' '}
              <GlowText as="span" color="purple" animate={false}>Instructor</GlowText>
            </h1>
            <p className="text-muted-foreground">Complete your application to start teaching</p>
          </motion.div>

          {/* Step Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-10"
          >
            {stepInfo.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    step === s.num
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : step > s.num
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-pointer'
                      : 'bg-muted/30 text-muted-foreground border border-border'
                  }`}
                >
                  {step > s.num ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.num}</span>
                </button>
                {i < stepInfo.length - 1 && (
                  <div className={`w-8 h-0.5 ${step > s.num ? 'bg-green-500/50' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Form Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-6 md:p-8 glow-border"
          >
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="John Doe"
                        className="pl-10 bg-background/50"
                        maxLength={100}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10 bg-background/50"
                        maxLength={255}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+91 9876543210"
                      className="pl-10 bg-background/50"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio / About Yourself *</Label>
                  <div className="relative mt-2">
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      placeholder="Tell us about yourself, your teaching philosophy, and what motivates you..."
                      rows={4}
                      className="bg-background/50"
                      maxLength={1000}
                    />
                    <span className="text-xs text-muted-foreground absolute bottom-2 right-3">
                      {formData.bio.length}/1000
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Profile Photo</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload your profile photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Expertise & Qualifications */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Expertise & Qualifications
                </h2>

                <div>
                  <Label htmlFor="qualifications">Qualifications & Certifications *</Label>
                  <Textarea
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={(e) => updateField('qualifications', e.target.value)}
                    placeholder="e.g., CEH, OSCP, CompTIA Security+, M.Sc. Cybersecurity..."
                    rows={3}
                    className="mt-2 bg-background/50"
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => updateField('experience', e.target.value)}
                    placeholder="e.g., 5 years in penetration testing"
                    className="mt-2 bg-background/50"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label>Teaching Expertise * (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {expertiseOptions.map((topic) => (
                      <Badge
                        key={topic}
                        variant={formData.selectedExpertise.includes(topic) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all duration-200 ${
                          formData.selectedExpertise.includes(topic)
                            ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => toggleExpertise(topic)}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="courseTopics">Course / Topic Preferences</Label>
                  <Textarea
                    id="courseTopics"
                    value={formData.courseTopics}
                    onChange={(e) => updateField('courseTopics', e.target.value)}
                    placeholder="Describe the courses or topics you'd like to teach..."
                    rows={3}
                    className="mt-2 bg-background/50"
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label>Resume / CV (optional)</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Upload your resume</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC up to 5MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Availability & Payment */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Availability & Payment
                </h2>

                <div>
                  <Label>Work Type *</Label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {(['part-time', 'full-time'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField('workType', type)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                          formData.workType === type
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className={`font-medium capitalize ${
                          formData.workType === type ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {type.replace('-', ' ')}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type === 'part-time' ? '10-20 hrs/week' : '40+ hrs/week'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Available Slots * (select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {availabilitySlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleAvailability(slot)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                          formData.availability.includes(slot)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {['Bank Transfer', 'UPI'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => updateField('paymentMethod', method)}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                          formData.paymentMethod === method
                            ? 'border-secondary bg-secondary/10'
                            : 'border-border hover:border-secondary/50'
                        }`}
                      >
                        <DollarSign className={`w-4 h-4 ${
                          formData.paymentMethod === method ? 'text-secondary' : 'text-muted-foreground'
                        }`} />
                        <span className={`font-medium text-sm ${
                          formData.paymentMethod === method ? 'text-secondary' : 'text-muted-foreground'
                        }`}>
                          {method}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.paymentMethod === 'Bank Transfer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => updateField('bankName', e.target.value)}
                        placeholder="State Bank of India"
                        className="mt-2 bg-background/50"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) => updateField('accountNumber', e.target.value)}
                        placeholder="XXXX XXXX XXXX"
                        className="mt-2 bg-background/50"
                        maxLength={20}
                      />
                    </div>
                  </motion.div>
                )}

                {formData.paymentMethod === 'UPI' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      value={formData.upiId}
                      onChange={(e) => updateField('upiId', e.target.value)}
                      placeholder="yourname@upi"
                      className="mt-2 bg-background/50"
                      maxLength={50}
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 4: Verification & Agreement */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Verification & Agreement
                </h2>

                <div>
                  <Label>ID Verification (optional)</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Verified instructors get a badge and higher visibility
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {['adhara', 'PAN Card', 'Passport'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField('idType', type)}
                        className={`p-3 rounded-xl border text-sm transition-all duration-200 ${
                          formData.idType === type
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.idType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <Label htmlFor="idNumber">{formData.idType} Number</Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => updateField('idNumber', e.target.value)}
                      placeholder={`Enter your ${formData.idType} number`}
                      className="mt-2 bg-background/50"
                      maxLength={20}
                    />
                    <div className="mt-3 border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Upload {formData.idType} copy (optional)</p>
                    </div>
                  </motion.div>
                )}

                <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
                  <h3 className="font-semibold text-sm">Agreements</h3>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => updateField('agreeTerms', checked === true)}
                    />
                    <label htmlFor="agreeTerms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>,{' '}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and{' '}
                      <Link to="/instructor-agreement" className="text-primary hover:underline">Instructor Agreement</Link>.
                      I understand that my application will be reviewed and I may be contacted for verification. *
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agreeCode"
                      checked={formData.agreeCode}
                      onCheckedChange={(checked) => updateField('agreeCode', checked === true)}
                    />
                    <label htmlFor="agreeCode" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to follow the{' '}
                      <Link to="/code-of-conduct" className="text-primary hover:underline">Code of Conduct</Link>{' '}
                      and maintain professional standards while teaching on SkillCoders. *
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <GlowButton variant="outline" onClick={() => setStep(step - 1)}>
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </span>
                </GlowButton>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <GlowButton
                  variant="primary"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                >
                  <span className="flex items-center gap-2">
                    Next Step
                    <CheckCircle className="w-4 h-4" />
                  </span>
                </GlowButton>
              ) : (
                <GlowButton
                  variant="secondary"
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Application
                  </span>
                </GlowButton>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InstructorApply;
