import React from "react";
import { cn } from "LLD/utils/cn";

function ContentItem({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("size-full min-h-0", className)}>
      {children}
    </div>
  );
}

function ContentComponent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={className}>
      {children}
    </div>
  );
}

ContentComponent.Item = ContentItem;

export const Content = ContentComponent;
