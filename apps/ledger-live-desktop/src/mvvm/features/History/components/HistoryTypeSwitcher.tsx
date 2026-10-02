import React, { useCallback } from "react";
import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { HISTORY_TAB_CARD, HISTORY_TAB_CRYPTO, type HistoryTab } from "../constants";

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
    <div className="flex justify-center">
      <SegmentedControl
        selectedValue={selectedTab}
        onSelectedChange={onSelectedChange}
        appearance="background"
        tabLayout="fit"
        aria-label={t("history.tabs.accessibilityLabel")}
        data-testid="history-type-switcher"
      >
        <SegmentedControlButton
          value={HISTORY_TAB_CRYPTO}
          data-testid="history-tab-crypto"
          className="min-w-[200px]"
        >
          {t("history.tabs.crypto")}
        </SegmentedControlButton>
        <SegmentedControlButton
          value={HISTORY_TAB_CARD}
          data-testid="history-tab-card"
          className="min-w-[200px]"
        >
          {t("history.tabs.card")}
        </SegmentedControlButton>
      </SegmentedControl>
    </div>
  );
}
