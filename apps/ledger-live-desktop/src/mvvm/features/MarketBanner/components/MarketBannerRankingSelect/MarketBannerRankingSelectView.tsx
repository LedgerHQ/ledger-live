import React, { memo } from "react";
import {
  MediaButton,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { MarketBannerRankingSelectItem } from "./useMarketBannerRankingSelectViewModel";
import { MARKET_BANNER_RANKING_SELECT_TESTID } from "../../utils/constants";

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
          <MediaButton
            appearance="no-background"
            size="sm"
            data-testid={MARKET_BANNER_RANKING_SELECT_TESTID}
          >
            {selectedLabel}
          </MediaButton>
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
