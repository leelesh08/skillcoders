import React from 'react';

export default function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" aria-hidden="true" />
        <div className="text-muted-foreground">{message}</div>
      </div>
    </div>
  );
}
