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
import { ANALYTICS_FILTER_VARIANTS, type AnalyticsFilterVariant } from "./analyticsFilterVariants";

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
  const renderIcon = (meta: AnalyticsFilterOptionMeta) => (
    <CryptoIcon ledgerId={meta.iconId} ticker={meta.ticker} size={24} shape={iconShape} />
  );
  return (
    <Select items={items} value={value} onOpenChange={onOpenChange} onValueChange={onValueChange}>
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
