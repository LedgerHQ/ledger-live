import type { ReactNode } from "react";
import { cn } from "@ledgerhq/lumen-utils-shared";

export type PillVariant = "success" | "muted" | "active" | "black";
export type PillSize = 1 | 2 | 3 | 4;

export interface PillProps {
  readonly variant: PillVariant;
  readonly size?: PillSize;
  readonly children: ReactNode;
}

const PALETTE: Record<PillVariant, string> = {
  success: "bg-success text-success",
  muted: "bg-muted text-muted",
  active: "bg-active-subtle text-active",
  black: "bg-black text-white",
};

export function Pill({ variant, size = 3, children }: PillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-4 rounded-full px-12 py-4",
        `body-${size}`,
        PALETTE[variant],
      )}
    >
      {children}
    </div>
  );
}
