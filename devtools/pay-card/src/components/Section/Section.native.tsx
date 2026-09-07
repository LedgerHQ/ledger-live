import type { ReactNode } from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

export interface SectionProps {
  readonly title: string;
  /** Tints the whole section, so sections that are read against each other stay told apart. */
  readonly backgroundColor?: "activeSubtle" | "warning" | "success";
  readonly children: ReactNode;
}

const CONTAINER_LX = { gap: "s12", padding: "s16" } as const;
const CONTENT_LX = { gap: "s8" } as const;

export function Section({ title, backgroundColor, children }: SectionProps) {
  return (
    <Box lx={backgroundColor === undefined ? CONTAINER_LX : { ...CONTAINER_LX, backgroundColor }}>
      <Text typography="body2" lx={{ color: "base" }}>
        {title}
      </Text>
      <Box lx={CONTENT_LX}>{children}</Box>
    </Box>
  );
}
