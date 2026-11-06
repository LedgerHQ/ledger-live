import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  BottomSheetHeader,
  BottomSheetView,
  MediaButton,
  SelectList,
  SelectListContent,
} from "@ledgerhq/lumen-ui-rnative";
import { CoinsCrypto, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { AnalyticsFilterItem } from "../AnalyticsFilterItem/AnalyticsFilterItem";
import type {
  AnalyticsFilterOptionMeta,
  AnalyticsFilterViewProps,
} from "../AnalyticsFilters/AnalyticsFiltersView.types";
import { ANALYTICS_FILTER_VARIANTS, type AnalyticsFilterVariant } from "./analyticsFilterVariants";
import { useAnalyticsFilterSheetViewModel } from "./useAnalyticsFilterSheetViewModel";

type AnalyticsFilterSelectProps = AnalyticsFilterViewProps &
  Readonly<{ variant: AnalyticsFilterVariant }>;

const FALLBACK_ICONS = { asset: CoinsCrypto, account: Wallet } as const;

export function AnalyticsFilterSelect({
  variant,
  ariaLabel,
  items,
  value,
  triggerLabel,
  selectedMeta,
  disabled,
  onOpenChange,
  onValueChange,
}: AnalyticsFilterSelectProps) {
  const { testId, iconShape, showSelectedIcon } = ANALYTICS_FILTER_VARIANTS[variant];
  const FallbackIcon = FALLBACK_ICONS[variant];
  const sheet = useAnalyticsFilterSheetViewModel({ onOpenChange, onValueChange });
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
        leadingContent={showSelectedIcon && selectedMeta ? renderIcon(selectedMeta) : undefined}
        onPress={sheet.open}
      >
        {triggerLabel}
      </MediaButton>
      <QueuedBottomSheet
        testID={`${testId}-sheet`}
        isRequestingToBeOpened={sheet.isOpen}
        enableDynamicSizing
        onClose={sheet.close}
      >
        <BottomSheetView>
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
        </BottomSheetView>
      </QueuedBottomSheet>
    </>
  );
}
