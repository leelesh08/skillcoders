import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // shimmer via gradient and pulse for nicer skeletons
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        'rounded-md overflow-hidden bg-muted/40',
        'relative before:absolute before:inset-0 before:transform before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-muted/60 before:to-transparent before:animate-[shimmer_1.2s_infinite]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
