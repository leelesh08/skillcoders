import { useState, useEffect, useCallback } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { X, CheckCircle, XCircle, Clock, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { Label } from '@/components/ui/label';
 import { Progress } from '@/components/ui/progress';
 import GlowButton from '@/components/GlowButton';
 import GlowText from '@/components/GlowText';
 import { QuizQuestion } from '@/data/quizQuestions';
 
 interface QuizModalProps {
   isOpen: boolean;
   onClose: () => void;
   questions: QuizQuestion[];
   domainName: string;
   level: number;
   creditsReward: number;
   onComplete: (score: number, total: number) => void;
 }
 
 const QuizModal = ({ 
   isOpen, 
   onClose, 
   questions, 
   domainName, 
   level, 
   creditsReward,
   onComplete 
 }: QuizModalProps) => {
   const [currentIndex, setCurrentIndex] = useState(0);
   const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
   const [isAnswered, setIsAnswered] = useState(false);
   const [score, setScore] = useState(0);
   const [isComplete, setIsComplete] = useState(false);
   const [timeLeft, setTimeLeft] = useState(30);
 
  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
 
  const moveToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= questions.length) {
        // compute final score including current selection if it was just answered
        const currentCorrect = questions[prevIndex]?.correctAnswer ?? -1;
        const extra = parseInt(selectedAnswer || '-1') === currentCorrect ? 1 : 0;
        setIsComplete(true);
        onComplete(score + extra, questions.length);
        return prevIndex;
      }
      // advance
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(30);
      return nextIndex;
    });
  }, [questions, onComplete, score, selectedAnswer]);

  const handleTimeout = useCallback(() => {
    if (!isAnswered) {
      setIsAnswered(true);
      setTimeout(() => moveToNext(), 1500);
    }
  }, [isAnswered, moveToNext]);

  useEffect(() => {
    if (!isOpen || isAnswered || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, isAnswered, isComplete, handleTimeout]);
 
  
 
   const handleSubmit = () => {
     if (selectedAnswer === null) return;
     
     setIsAnswered(true);
     const isCorrect = parseInt(selectedAnswer) === currentQuestion.correctAnswer;
     if (isCorrect) {
       setScore((prev) => prev + 1);
     }
   };
 

 
   const resetQuiz = () => {
     setCurrentIndex(0);
     setSelectedAnswer(null);
     setIsAnswered(false);
     setScore(0);
     setIsComplete(false);
     setTimeLeft(30);
   };
 
   const handleClose = () => {
     resetQuiz();
     onClose();
   };

  if (questions.length === 0 || !isOpen) return null;
 
   return (
     <AnimatePresence>
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
         onClick={handleClose}
       >
         <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0.9, opacity: 0 }}
           className="relative w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl"
           onClick={(e) => e.stopPropagation()}
         >
           {/* Close button */}
           <button
             onClick={handleClose}
             className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
 
           {!isComplete ? (
             <>
               {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft <= 10 ? 'border-red-500/50 bg-red-500/10' : 'border-border bg-muted/50'}`}>
                      <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                      <span className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-foreground'}`}>
                        {timeLeft}s
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      {domainName} • Level {level}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Question {currentIndex + 1} of {questions.length}
                    </p>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
 
               {/* Question */}
               <motion.div
                 key={currentIndex}
                 initial={{ x: 20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 className="mb-6"
               >
                 <h3 className="text-xl font-semibold mb-6">
                   {currentQuestion.question}
                 </h3>
 
                 <RadioGroup
                   value={selectedAnswer || ''}
                   onValueChange={setSelectedAnswer}
                   disabled={isAnswered}
                   className="space-y-3"
                 >
                   {currentQuestion.options.map((option, index) => {
                     const isCorrect = index === currentQuestion.correctAnswer;
                     const isSelected = selectedAnswer === String(index);
                     
                     let optionClass = 'border-border hover:border-primary/50';
                     if (isAnswered) {
                       if (isCorrect) {
                         optionClass = 'border-green-500 bg-green-500/10';
                       } else if (isSelected && !isCorrect) {
                         optionClass = 'border-red-500 bg-red-500/10';
                       }
                     } else if (isSelected) {
                       optionClass = 'border-primary bg-primary/10';
                     }
 
                     return (
                       <motion.div
                         key={index}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: index * 0.1 }}
                       >
                         <Label
                           htmlFor={`option-${index}`}
                           className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${optionClass}`}
                         >
                           <RadioGroupItem value={String(index)} id={`option-${index}`} />
                           <span className="flex-1">{option}</span>
                           {isAnswered && isCorrect && (
                             <CheckCircle className="w-5 h-5 text-green-500" />
                           )}
                           {isAnswered && isSelected && !isCorrect && (
                             <XCircle className="w-5 h-5 text-red-500" />
                           )}
                         </Label>
                       </motion.div>
                     );
                   })}
                 </RadioGroup>
               </motion.div>
 
               {/* Actions */}
               <div className="flex justify-between items-center">
                 <p className="text-sm text-muted-foreground">
                   Score: <span className="text-primary font-bold">{score}</span> / {currentIndex + (isAnswered ? 1 : 0)}
                 </p>
                 
                 {!isAnswered ? (
                   <GlowButton
                     variant="primary"
                     onClick={handleSubmit}
                     disabled={selectedAnswer === null}
                   >
                     Submit Answer
                   </GlowButton>
                 ) : (
                   <GlowButton variant="secondary" onClick={moveToNext}>
                     {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </GlowButton>
                 )}
               </div>
             </>
           ) : (
             /* Results Screen */
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-center py-8"
             >
               <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                 <Trophy className="w-10 h-10 text-white" />
               </div>
               
               <h2 className="text-2xl font-bold mb-2">
                 <GlowText color="gradient">Quiz Complete!</GlowText>
               </h2>
               
               <p className="text-muted-foreground mb-6">
                 {domainName} • Level {level}
               </p>
 
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-muted/50 rounded-xl p-4">
                   <p className="text-3xl font-bold text-primary">{score}</p>
                   <p className="text-sm text-muted-foreground">Correct Answers</p>
                 </div>
                 <div className="bg-muted/50 rounded-xl p-4">
                   <p className="text-3xl font-bold text-yellow-500">
                     {Math.round((score / questions.length) * 100)}%
                   </p>
                   <p className="text-sm text-muted-foreground">Accuracy</p>
                 </div>
               </div>
 
               {score >= questions.length * 0.7 ? (
                 <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                   <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                   <p className="text-green-500 font-medium">
                     Congratulations! You earned {creditsReward} credits!
                   </p>
                 </div>
               ) : (
                 <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                   <p className="text-orange-500">
                     You need 70% to pass. Try again!
                   </p>
                 </div>
               )}
 
               <div className="flex gap-3 justify-center">
                 <Button variant="outline" onClick={resetQuiz}>
                   <RotateCcw className="w-4 h-4 mr-2" />
                   Try Again
                 </Button>
                 <GlowButton variant="primary" onClick={handleClose}>
                   Continue
                 </GlowButton>
               </div>
             </motion.div>
           )}
         </motion.div>
       </motion.div>
     </AnimatePresence>
   );
 };
 
 export default QuizModal;