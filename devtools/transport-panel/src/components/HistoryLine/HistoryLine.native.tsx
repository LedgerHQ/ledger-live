import type { Envelope, MessageMap } from "@devtools/transport";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { TouchableOpacity } from "react-native";
import { useHistoryLine } from "../../hooks";

interface HistoryLineProps<M extends MessageMap> {
  readonly envelope: Envelope<M>;
  readonly localOrigin: string;
}

export function HistoryLine<M extends MessageMap>({ envelope, localOrigin }: HistoryLineProps<M>) {
  const { isExpanded, setIsExpanded, isSent, collapsedText, expandedText } = useHistoryLine(
    envelope,
    localOrigin,
  );

  return (
    <TouchableOpacity onPress={() => setIsExpanded(prev => !prev)} activeOpacity={0.7}>
      <Box lx={{ flexDirection: "row", alignItems: "flex-start", gap: "s8", padding: "s4" }}>
        <Text typography="body4" lx={{ color: isSent ? "active" : "muted" }}>
          {isSent ? "↑" : "↓"}
        </Text>
        <Text typography="body4" lx={{ color: isExpanded ? "base" : "muted" }}>
          {isExpanded ? expandedText : collapsedText}
        </Text>
      </Box>
    </TouchableOpacity>
  );
}
