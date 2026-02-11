import React from "react";
import { cn } from "LLD/utils/cn";

type StaticSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function StaticSection({ children, className, ...props }: StaticSectionProps) {
  return (
    <div {...props} className={cn("shrink-0", className)}>
      {children}
    </div>
  );
}
