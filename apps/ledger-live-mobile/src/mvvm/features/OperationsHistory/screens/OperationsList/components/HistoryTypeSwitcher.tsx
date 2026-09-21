import React, { useCallback } from "react";
import { Box, SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import {
  HISTORY_TAB_CARD,
  HISTORY_TAB_CRYPTO,
  type HistoryTab,
} from "LLM/features/OperationsHistory/constants";

const HISTORY_TAB_VALUES = new Set<string>([HISTORY_TAB_CRYPTO, HISTORY_TAB_CARD]);

type HistoryTypeSwitcherProps = Readonly<{
  selectedTab: HistoryTab;
  onTabChange: (tab: HistoryTab) => void;
}>;

export function HistoryTypeSwitcher({ selectedTab, onTabChange }: HistoryTypeSwitcherProps) {
  const { t } = useTranslation();

  const onSelectedChange = useCallback(
    (value: string) => {
      if (HISTORY_TAB_VALUES.has(value)) {
        onTabChange(value as HistoryTab);
      }
    },
    [onTabChange],
  );

  return (
    <Box lx={{ width: "full", flexDirection: "row", justifyContent: "center" }}>
      <SegmentedControl
        selectedValue={selectedTab}
        onSelectedChange={onSelectedChange}
        accessibilityLabel={t("history.tabs.accessibilityLabel")}
        testID="history-type-switcher"
        tabLayout="fit"
      >
        <SegmentedControlButton value={HISTORY_TAB_CRYPTO} testID="history-tab-crypto">
          {t("history.tabs.crypto")}
        </SegmentedControlButton>
        <SegmentedControlButton value={HISTORY_TAB_CARD} testID="history-tab-card">
          {t("history.tabs.card")}
        </SegmentedControlButton>
      </SegmentedControl>
    </Box>
  );
}
