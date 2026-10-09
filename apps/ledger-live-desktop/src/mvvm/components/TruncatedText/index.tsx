import React, { useCallback, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type TruncatedTextProps = Readonly<{
  text: string;
  className?: string;
  as?: "div" | "span";
}>;

export function TruncatedText({ text, className, as = "div" }: TruncatedTextProps) {
  const textRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const assignTextRef = useCallback((node: HTMLElement | null) => {
    textRef.current = node;
  }, []);

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

  const Tag = as;

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <Tag
          ref={assignTextRef}
          className={cn("min-w-0 max-w-full truncate", as === "span" && "block", className)}
        >
          {text}
        </Tag>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
