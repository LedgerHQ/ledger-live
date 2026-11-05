import { ScrollView } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { DIFF_SIGNS, type DiffLine, type DiffState } from "../../coin-config/internals/diff";

const LINE_COLORS: Record<DiffState, "success" | "error" | "muted"> = {
  added: "success",
  removed: "error",
  none: "muted",
};

function DiffLineText({ line }: Readonly<{ line: DiffLine }>) {
  return (
    <Text
      typography="body3"
      lx={{ color: LINE_COLORS[line.state] }}
      style={{ fontFamily: "monospace" }}
    >
      {`${DIFF_SIGNS[line.state]} ${line.text}`}
    </Text>
  );
}

export function ConfigDiffView({ diff }: Readonly<{ diff: DiffLine[] }>) {
  return (
    <Box lx={{ backgroundColor: "canvasMuted", borderRadius: "md" }} style={{ minHeight: 200 }}>
      <ScrollView contentContainerStyle={{ padding: 8 }}>
        {diff.map((line, index) => (
          <DiffLineText key={`${index}-${line.state}`} line={line} />
        ))}
      </ScrollView>
    </Box>
  );
}
