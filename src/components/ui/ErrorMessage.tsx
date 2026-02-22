import React from 'react';
import GlowCard from '@/components/GlowCard';

export default function ErrorMessage({ message }: { message?: string }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <GlowCard glowColor="red">
        <div className="p-6 text-center max-w-lg">
          <h3 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">{message ?? 'Unable to load data. Please try again later.'}</p>
        </div>
      </GlowCard>
    </div>
  );
}
