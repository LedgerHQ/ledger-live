import React from "react";
import { cn } from "LLD/utils/cn";
import { DialogBackgroundContext } from "LLD/contexts/DialogBackgroundContext";
import type { DialogBackgroundTone } from "LLD/contexts/DialogBackgroundContext";
import { useDialogBackgroundToneRequests } from "LLD/hooks/useDialogBackgroundToneRequests";

type DialogBackgroundGradientProps = Readonly<{
  tone: DialogBackgroundTone;
}>;

const GRADIENT_CLASS_NAME_BY_TONE: Record<DialogBackgroundTone, string> = {
  error: "bg-gradient-error",
  info: "bg-gradient-muted",
  success: "bg-gradient-success",
};

export function DialogBackgroundGradient({ tone }: DialogBackgroundGradientProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-full",
        GRADIENT_CLASS_NAME_BY_TONE[tone],
      )}
      data-testid={`dialog-status-gradient-${tone}`}
    />
  );
}

export function DialogBackgroundToneProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { backgroundTone, backgroundContextValue } = useDialogBackgroundToneRequests();

  return (
    <DialogBackgroundContext.Provider value={backgroundContextValue}>
      {backgroundTone ? <DialogBackgroundGradient tone={backgroundTone} /> : null}
      {children}
    </DialogBackgroundContext.Provider>
  );
}
