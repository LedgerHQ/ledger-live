import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  MediaButton,
  SelectList,
  SelectListContent,
} from "@ledgerhq/lumen-ui-rnative";
import { CoinsCrypto, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { AnalyticsFilterItem } from "../AnalyticsFilterItem/AnalyticsFilterItem";
import type { AnalyticsFilterOptionMeta } from "../AnalyticsFilters/AnalyticsFiltersView.types";
import { ANALYTICS_FILTER_VARIANTS } from "./analyticsFilterVariants";
import type { AnalyticsFilterSelectProps } from "./AnalyticsFilterSelect.types";
import type { AnalyticsFilterSelectViewModel } from "./useAnalyticsFilterSelectViewModel";

type AnalyticsFilterSelectViewProps = Omit<
  AnalyticsFilterSelectProps,
  "onOpenChange" | "onValueChange"
> &
  Readonly<{ sheet: AnalyticsFilterSelectViewModel }>;

const FALLBACK_ICONS = { asset: CoinsCrypto, account: Wallet } as const;

export function AnalyticsFilterSelectView({
  variant,
  ariaLabel,
  items,
  value,
  triggerLabel,
  selectedMeta,
  disabled,
  sheet,
}: AnalyticsFilterSelectViewProps) {
  const { testId, iconShape } = ANALYTICS_FILTER_VARIANTS[variant];
  const FallbackIcon = FALLBACK_ICONS[variant];
  const renderIcon = (meta: AnalyticsFilterOptionMeta) => (
    <CryptoIcon ledgerId={meta.iconId} ticker={meta.ticker} size={24} shape={iconShape} />
  );
  return (
    <>
      <MediaButton
        appearance="gray"
        size="sm"
        accessibilityLabel={ariaLabel}
        testID={testId}
        disabled={disabled}
        leadingContentShape="rounded"
        leadingContent={selectedMeta ? renderIcon(selectedMeta) : undefined}
        onPress={sheet.open}
      >
        {triggerLabel}
      </MediaButton>
      <QueuedBottomSheet
        testID={`${testId}-sheet`}
        isRequestingToBeOpened={sheet.isOpen}
        enableDynamicSizing
        maxDynamicContentSize="fullWithOffset"
        onClose={sheet.close}
      >
        <BottomSheetScrollView>
          <BottomSheetHeader />
          <SelectList items={items} value={value} onValueChange={sheet.selectOption}>
            <SelectListContent
              lx={{ paddingHorizontal: "s8", paddingBottom: "s24" }}
              renderItem={item => {
                const meta = items.find(option => option.value === item.value)?.meta;
                return (
                  <AnalyticsFilterItem
                    key={item.value}
                    value={item.value}
                    label={item.label}
                    description={meta?.networkName}
                    icon={meta ? renderIcon(meta) : <FallbackIcon size={24} />}
                    testID={`${testId}-option-${item.value || "all"}`}
                  />
                );
              }}
            />
          </SelectList>
        </BottomSheetScrollView>
      </QueuedBottomSheet>
    </>
  );
}
