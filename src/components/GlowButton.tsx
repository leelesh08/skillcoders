import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const GlowButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
}: GlowButtonProps) => {
  const baseStyles = "relative font-semibold rounded-lg transition-all duration-300 overflow-hidden shadow-[0_0_12px_hsl(var(--cyber-blue)/0.25),0_0_24px_hsl(var(--cyber-blue)/0.1)] hover:shadow-[0_0_20px_hsl(var(--cyber-blue)/0.4),0_0_40px_hsl(var(--cyber-blue)/0.15)]";

  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_12px_hsl(var(--cyber-purple)/0.25),0_0_24px_hsl(var(--cyber-purple)/0.1)] hover:shadow-[0_0_20px_hsl(var(--cyber-purple)/0.4),0_0_40px_hsl(var(--cyber-purple)/0.15)]",
    outline: "border border-primary text-primary hover:bg-primary/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: variant === 'primary'
            ? 'radial-gradient(circle at center, hsla(199, 89%, 48%, 0.4) 0%, transparent 70%)'
            : variant === 'secondary'
              ? 'radial-gradient(circle at center, hsla(262, 83%, 58%, 0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, hsla(199, 89%, 48%, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{ x: ['0%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        style={{
          background: 'linear-gradient(90deg, transparent, hsla(0, 0%, 100%, 0.1), transparent)',
        }}
      />

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default GlowButton;
