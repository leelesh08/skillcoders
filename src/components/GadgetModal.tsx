import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingCart, Package, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GlowButton from '@/components/GlowButton';
import { useCart } from '@/contexts/CartContext';

export interface GadgetModalItem {
    id: number;
    name: string;
    description: string;
    price: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    inStock: boolean;
}

interface GadgetModalProps {
    gadget: GadgetModalItem | null;
    onClose: () => void;
    onBuy?: (gadget: GadgetModalItem) => void;
}

export default function GadgetModal({ gadget, onClose, onBuy }: GadgetModalProps) {
    const { add } = useCart();

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Lock body scroll while open
    useEffect(() => {
        if (gadget) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [gadget]);

    return (
        <AnimatePresence>
            {gadget && (
                // Backdrop
                <motion.div
                    key="gadget-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                >
                    {/* Modal panel */}
                    <motion.div
                        key="gadget-modal-panel"
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
                                src={gadget.image}
                                alt={gadget.name}
                                className="w-full h-52 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                            {/* Stock badge */}
                            <Badge
                                className={`absolute bottom-3 left-3 ${gadget.inStock ? 'bg-green-500/80' : 'bg-red-500/80'}`}
                            >
                                {gadget.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                            {/* Category badge */}
                            <Badge variant="outline" className="absolute bottom-3 right-3 bg-background/80">
                                {gadget.category}
                            </Badge>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <h2 className="text-2xl font-bold leading-snug">{gadget.name}</h2>

                            {/* Rating row */}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    <strong className="text-foreground">{gadget.rating}</strong>
                                </span>
                                <span>({gadget.reviews.toLocaleString()} reviews)</span>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground leading-relaxed">{gadget.description}</p>

                            {/* Feature highlights */}
                            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-2">
                                <p className="text-sm font-semibold flex items-center gap-2 text-cyan-400">
                                    <Package className="w-4 h-4" /> What's in the box
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>{gadget.name} device</li>
                                    <li>Quick-start manual & documentation</li>
                                    <li>1-year manufacturer warranty</li>
                                </ul>
                            </div>

                            {/* Category tag */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Tag className="w-4 h-4 text-primary" />
                                Category: <span className="font-medium text-foreground">{gadget.category}</span>
                            </div>

                            {/* Price + Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <span className="text-2xl font-bold text-primary">
                                    ₹{gadget.price.toLocaleString()}
                                </span>
                                <div className="flex items-center gap-2">
                                    <GlowButton
                                        variant="secondary"
                                        size="sm"
                                        disabled={!gadget.inStock}
                                        onClick={() =>
                                            add({ id: gadget.id, title: gadget.name, price: gadget.price, quantity: 1 })
                                        }
                                    >
                                        <ShoppingCart className="w-4 h-4 mr-1" />
                                        {gadget.inStock ? 'Add to Cart' : 'Notify Me'}
                                    </GlowButton>
                                    <GlowButton
                                        variant="primary"
                                        size="sm"
                                        disabled={!gadget.inStock}
                                        onClick={() => {
                                            onClose();
                                            onBuy?.(gadget);
                                        }}
                                    >
                                        Buy Now
                                    </GlowButton>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
