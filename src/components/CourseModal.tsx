import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Users, Clock, BookOpen, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

export type CourseModalItem = {
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

interface CourseModalProps {
    course: CourseModalItem | null;
    onClose: () => void;
    onEnroll?: (id: string | number) => void;
}

const levelColors: Record<string, string> = {
    Beginner: 'bg-green-500/80',
    Intermediate: 'bg-blue-500/80',
    Advanced: 'bg-orange-500/80',
    Expert: 'bg-red-500/80',
};

export default function CourseModal({ course, onClose, onEnroll }: CourseModalProps) {
    const { add } = useCart();

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Lock body scroll while modal is open
    useEffect(() => {
        if (course) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [course]);

    return (
        <AnimatePresence>
            {course && (
                // Backdrop
                <motion.div
                    key="course-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                >
                    {/* Modal panel — stop click propagation so backdrop click doesn't fire inside */}
                    <motion.div
                        key="course-modal-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Hero image */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={course.image ?? ''}
                                alt={course.title}
                                className="w-full h-52 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                            <Badge
                                className={`absolute bottom-3 left-3 ${levelColors[course.level ?? ''] ?? 'bg-primary/80'}`}
                            >
                                {course.level ?? 'Course'}
                            </Badge>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <p className="text-sm font-medium text-primary">{course.category}</p>
                            <h2 className="text-2xl font-bold leading-snug">{course.title}</h2>
                            {course.instructor && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    Instructor: <span className="text-foreground font-medium ml-1">{course.instructor}</span>
                                </p>
                            )}

                            {/* Stats row */}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t border-border pt-4">
                                {course.rating !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        <strong className="text-foreground">{course.rating}</strong> rating
                                    </span>
                                )}
                                {course.students !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {course.students.toLocaleString()} students
                                    </span>
                                )}
                                {course.duration && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {course.duration}
                                    </span>
                                )}
                            </div>

                            {/* What you'll learn — decorative */}
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" /> What you'll learn
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Industry-grade techniques in {course.category}</li>
                                    <li>Hands-on labs and real-world scenarios</li>
                                    <li>Certificate of completion</li>
                                </ul>
                            </div>

                            {/* Price + Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <span className="text-2xl font-bold text-primary">
                                    ₹{(course.price ?? 0).toLocaleString()}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            add({ id: course.id, title: course.title, price: course.price ?? 0, quantity: 1 })
                                        }
                                    >
                                        Add to Cart
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            onClose();
                                            onEnroll?.(course.id);
                                        }}
                                    >
                                        Enroll Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
