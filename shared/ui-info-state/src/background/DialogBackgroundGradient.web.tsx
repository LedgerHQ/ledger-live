import React from "react";
import { cn } from "../internals/cn.web";
import { DialogBackgroundContext, type DialogBackgroundTone } from "./DialogBackgroundContext.web";
import { useDialogBackgroundToneRequests } from "./useDialogBackgroundToneRequests.web";

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
