import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { AccountAnalyticsIntroductionToolProps } from "../types";
import { copy, statusOf } from "./copy";

const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "s12",
  paddingHorizontal: "s16",
  paddingVertical: "s12",
} as const;

export function AccountAnalyticsIntroduction({
  hasDismissed,
  onReset,
}: AccountAnalyticsIntroductionToolProps) {
  return (
    <Box lx={ROW_LX}>
      <Text typography="body3" lx={{ color: "muted" }} style={{ flexShrink: 1 }}>
        {statusOf(hasDismissed)}
      </Text>
      <Button appearance="accent" size="sm" disabled={!hasDismissed} onPress={onReset}>
        {copy.reset}
      </Button>
    </Box>
  );
}
