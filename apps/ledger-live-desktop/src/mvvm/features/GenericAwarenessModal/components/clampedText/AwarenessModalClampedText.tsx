import React, { useCallback, useMemo, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type AwarenessModalClampedTextMaxLines = 1 | 2 | 3;

type AwarenessModalClampedTextProps = Readonly<{
  text: string;
  maxLines: AwarenessModalClampedTextMaxLines;
  className?: string;
}>;

const getMultilineClampStyle = (maxLines: 2 | 3): React.CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: maxLines,
  overflow: "hidden",
});

const isTextOverflowing = (
  element: HTMLElement,
  maxLines: AwarenessModalClampedTextMaxLines,
): boolean => {
  if (maxLines === 1) {
    return element.scrollWidth > element.clientWidth;
  }
  return element.scrollHeight > element.clientHeight;
};

export function AwarenessModalClampedText({
  text,
  maxLines,
  className,
}: AwarenessModalClampedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  const clampStyle = useMemo(
    () => (maxLines === 1 ? undefined : getMultilineClampStyle(maxLines)),
    [maxLines],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setOpen(false);
        return;
      }
      const element = textRef.current;
      if (element && isTextOverflowing(element, maxLines)) {
        setOpen(true);
      }
    },
    [maxLines],
  );

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <span
          ref={textRef}
          data-testid="awareness-modal-clamped-text"
          style={{
            display: "block",
            ...clampStyle,
          }}
          className={cn("min-w-0 max-w-full", maxLines === 1 && "truncate", className)}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
