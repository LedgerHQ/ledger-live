import React, { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { MarketBannerRankingSelectItem } from "./useMarketBannerRankingSelectViewModel";
import { MARKET_BANNER_RANKING_SELECT_TESTID } from "../../utils/constants";
import { ChevronDown } from "@ledgerhq/lumen-ui-react/symbols";

type MarketBannerRankingSelectViewProps = Readonly<{
  options: MarketBannerRankingSelectItem[];
  selectedValue: string | null;
  selectedLabel?: string;
  onValueChange: (selected: string | null) => void;
}>;

export const MarketBannerRankingSelectView = memo(function MarketBannerRankingSelectView({
  options,
  selectedValue,
  selectedLabel,
  onValueChange,
}: MarketBannerRankingSelectViewProps) {
  return (
    <Select items={options} value={selectedValue} onValueChange={onValueChange}>
      <SelectTrigger
        render={() => (
          <div
            className="flex items-center gap-2 text-muted hover:text-muted-pressed cursor-pointer body-2-semi-bold"
            data-testid={MARKET_BANNER_RANKING_SELECT_TESTID}
          >
            {selectedLabel}
            <ChevronDown size={16} />
          </div>
        )}
      />
      <SelectContent className="min-w-176 bg-muted" align="end">
        <SelectList
          renderItem={item => (
            <SelectItem
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              data-testid={`market-banner-ranking-option-${item.value}`}
            >
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  );
});
