import React from "react";
import {
  MediaButton,
  Select,
  SelectContent,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { CoinsCrypto, Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import { AnalyticsFilterItem } from "../AnalyticsFilterItem/AnalyticsFilterItem";
import type {
  AnalyticsFilterOptionMeta,
  AnalyticsFilterViewProps,
} from "../AnalyticsFilters/AnalyticsFiltersView.types";

type AnalyticsFilterSelectProps = AnalyticsFilterViewProps &
  Readonly<{ variant: "asset" | "account" }>;

const VARIANTS = {
  asset: {
    testId: "analytics-asset-filter",
    FallbackIcon: CoinsCrypto,
    iconShape: undefined,
    showSelectedIcon: true,
  },
  account: {
    testId: "analytics-account-filter",
    FallbackIcon: Wallet,
    iconShape: "square",
    showSelectedIcon: false,
  },
} as const;

export function AnalyticsFilterSelect({
  variant,
  ariaLabel,
  items,
  value,
  triggerLabel,
  selectedMeta,
  disabled,
  onValueChange,
}: AnalyticsFilterSelectProps) {
  const { testId, FallbackIcon, iconShape, showSelectedIcon } = VARIANTS[variant];
  const renderIcon = (meta: AnalyticsFilterOptionMeta) => (
    <CryptoIcon ledgerId={meta.iconId} ticker={meta.ticker} size={24} shape={iconShape} />
  );
  return (
    <Select items={items} value={value} onValueChange={onValueChange}>
      <SelectTrigger
        disabled={disabled}
        render={() => (
          <MediaButton
            appearance="gray"
            size="sm"
            aria-label={ariaLabel}
            data-testid={testId}
            leadingContentShape="rounded"
            leadingContent={showSelectedIcon && selectedMeta ? renderIcon(selectedMeta) : undefined}
          >
            {triggerLabel}
          </MediaButton>
        )}
      />
      <SelectContent className="max-h-224 w-max min-w-[343px] max-w-(--available-width) bg-canvas-sheet shadow-sm">
        <SelectList<string, AnalyticsFilterOptionMeta>
          className="scrollbar-none py-12"
          renderItem={item => (
            <AnalyticsFilterItem
              key={item.value}
              value={item.value}
              label={item.label}
              description={item.meta?.networkName}
              icon={item.meta ? renderIcon(item.meta) : <FallbackIcon size={24} />}
            />
          )}
        />
      </SelectContent>
    </Select>
  );
}
