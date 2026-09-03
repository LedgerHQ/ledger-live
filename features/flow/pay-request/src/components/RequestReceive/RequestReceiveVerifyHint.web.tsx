import React, { useEffect, type ReactNode } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@ledgerhq/lumen-ui-react";
import type { RequestReceiveVerifyHint as RequestReceiveVerifyHintProps } from "../../types";

type Props = RequestReceiveVerifyHintProps &
  Readonly<{
    children: ReactNode;
  }>;

export function RequestReceiveVerifyHint({
  open,
  message,
  gotItLabel,
  onGotIt,
  onShown,
  children,
}: Props) {
  useEffect(() => {
    if (open) onShown?.();
  }, [open, onShown]);
  return (
    <Popover open={open} onOpenChange={() => undefined}>
      <PopoverTrigger render={<div className="relative z-menu flex-1">{children}</div>} />
      {/* Request dialog sets pointer-events: none on body. */}
      <PopoverContent side="top" align="end" className="pointer-events-auto max-w-256">
        <div className="flex flex-col gap-12" data-testid="pay-request-receive-verify-hint">
          <p className="body-2 whitespace-pre-line text-base">{message}</p>
          <Button size="sm" className="self-end" onClick={onGotIt}>
            {gotItLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
