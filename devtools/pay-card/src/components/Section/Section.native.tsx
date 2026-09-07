import type { ReactNode } from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

export interface SectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

const CONTAINER_LX = { gap: "s12", padding: "s16" } as const;
const CONTENT_LX = { gap: "s8" } as const;

export function Section({ title, children }: SectionProps) {
  return (
    <Box lx={CONTAINER_LX}>
      <Text typography="body2" lx={{ color: "base" }}>
        {title}
      </Text>
      <Box lx={CONTENT_LX}>{children}</Box>
    </Box>
  );
}
