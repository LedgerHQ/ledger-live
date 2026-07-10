import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { PlaygroundViewProps } from "./types";

export function PlaygroundView({ title, description }: PlaygroundViewProps) {
  return (
    <Box
      lx={{
        flexDirection: "column",
        gap: "s8",
        borderRadius: "md",
        backgroundColor: "canvasMuted",
        padding: "s16",
      }}
    >
      <Text typography="body1SemiBold" lx={{ color: "base" }}>
        {title}
      </Text>
      <Text typography="body3" lx={{ color: "muted" }}>
        {description}
      </Text>
    </Box>
  );
}
