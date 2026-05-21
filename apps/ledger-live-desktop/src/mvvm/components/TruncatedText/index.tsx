import React, { useCallback, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type TruncatedTextProps = Readonly<{
  text: string;
  className?: string;
}>;

export function TruncatedText({ text, className }: TruncatedTextProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(false);
      return;
    }
    const element = textRef.current;
    if (element && element.scrollWidth > element.clientWidth) {
      setOpen(true);
    }
  }, []);

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <div ref={textRef} className={cn("min-w-0 max-w-full truncate", className)}>
          {text}
        </div>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
