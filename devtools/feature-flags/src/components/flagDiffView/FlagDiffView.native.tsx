import { ScrollView } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { DiffLine, DiffState } from "../../utils";

interface FlagDiffViewProps {
  readonly diff: DiffLine[];
}

const STATE_STYLES: Record<DiffState, { sign: string; color: "success" | "error" | "muted" }> = {
  added: { sign: "+", color: "success" },
  removed: { sign: "-", color: "error" },
  none: { sign: " ", color: "muted" },
};

export function FlagDiffView({ diff }: FlagDiffViewProps) {
  return (
    <Box lx={{ backgroundColor: "canvasMuted", borderRadius: "md" }} style={{ minHeight: 200 }}>
      <ScrollView contentContainerStyle={{ padding: 8 }}>
        {diff.map(({ state, text }, index) => {
          const { sign, color } = STATE_STYLES[state];
          return (
            <Text
              key={`${index}-${state}-${text}`}
              typography="body3"
              lx={{ color }}
              style={{ fontFamily: "monospace" }}
            >
              {sign} {text}
            </Text>
          );
        })}
      </ScrollView>
    </Box>
  );
}
