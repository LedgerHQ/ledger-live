import { ScrollView } from "react-native";
import {
  Box,
  Button,
  SegmentedControl,
  SegmentedControlButton,
  Text,
  useTheme,
} from "@ledgerhq/lumen-ui-rnative";
import type { AccountDetailToolProps } from "../types";
import { copy, ELIGIBILITY_OPTIONS, eligibilityOf, statusOf } from "./copy";
import { eligibilityOptionOf, selectEligibilityOption } from "./eligibility";

const SECTION_LX = { gap: "s8", paddingHorizontal: "s16", paddingVertical: "s12" } as const;
const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "s12",
} as const;

export function AccountDetail({ analyticsIntroduction }: AccountDetailToolProps) {
  const { hasDismissed, isEligible, onReset, onEligibilityChange } = analyticsIntroduction;
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
        <Box lx={ROW_LX}>
          <Text typography="body3" lx={{ color: "muted" }} style={{ flexShrink: 1 }}>
            {eligibilityOf(isEligible)}
          </Text>
          <SegmentedControl
            selectedValue={eligibilityOptionOf(isEligible)}
            onSelectedChange={value => selectEligibilityOption(value, onEligibilityChange)}
          >
            {ELIGIBILITY_OPTIONS.map(option => (
              <SegmentedControlButton key={option.value} value={option.value}>
                {option.label}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </Box>
      </Box>
    </ScrollView>
  );
}
