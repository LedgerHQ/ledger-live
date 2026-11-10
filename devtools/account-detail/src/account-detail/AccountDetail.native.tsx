import { ScrollView } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { AccountDetailToolProps } from "../types";
import { copy, eligibilityOf, statusOf } from "./copy";

const SECTION_LX = { gap: "s8", paddingHorizontal: "s16", paddingVertical: "s12" } as const;
const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "s12",
} as const;

export function AccountDetail({ analyticsIntroduction }: AccountDetailToolProps) {
  const { hasDismissed, isEligible, onReset } = analyticsIntroduction;
  const { theme } = useTheme();

  return (
    <ScrollView>
      <Box
        lx={SECTION_LX}
        style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
      >
        <Text typography="body2SemiBold">{copy.analyticsIntroductionTitle}</Text>
        <Box lx={ROW_LX}>
          <Text typography="body3" lx={{ color: "muted" }} style={{ flexShrink: 1 }}>
            {statusOf(hasDismissed)}
          </Text>
          <Button appearance="accent" size="sm" disabled={!hasDismissed} onPress={onReset}>
            {copy.reset}
          </Button>
        </Box>
        <Text typography="body3" lx={{ color: "muted" }}>
          {eligibilityOf(isEligible)}
        </Text>
      </Box>
    </ScrollView>
  );
}
