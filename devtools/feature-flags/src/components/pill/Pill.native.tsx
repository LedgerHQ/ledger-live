import type { ComponentProps, ReactNode } from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

export type PillVariant = "success" | "muted" | "active" | "black";
export type PillSize = 1 | 2 | 3 | 4;

export interface PillProps {
  readonly variant: PillVariant;
  readonly size?: PillSize;
  readonly children: ReactNode;
}

type BackgroundToken = NonNullable<ComponentProps<typeof Box>["lx"]>["backgroundColor"];
type TextColorToken = NonNullable<ComponentProps<typeof Text>["lx"]>["color"];

const BACKGROUND: Record<PillVariant, BackgroundToken> = {
  success: "success",
  muted: "muted",
  active: "activeSubtle",
  black: "black",
};

const TEXT_COLOR: Record<PillVariant, TextColorToken> = {
  success: "success",
  muted: "muted",
  active: "active",
  black: "white",
};

const BOX_LX = {
  paddingHorizontal: "s12",
  paddingVertical: "s4",
  borderRadius: "full",
} as const;

export function Pill({ variant, size = 3, children }: PillProps) {
  const isText = typeof children === "string" || typeof children === "number";
  return (
    <Box lx={{ ...BOX_LX, backgroundColor: BACKGROUND[variant] }}>
      {isText ? (
        <Text typography={`body${size}`} lx={{ color: TEXT_COLOR[variant] }}>
          {children}
        </Text>
      ) : (
        <Box>{children}</Box>
      )}
    </Box>
  );
}
