import React from "react";
import { cn } from "../internals/cn";
import type { DialogBackgroundTone } from "./DialogBackgroundContext";

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
