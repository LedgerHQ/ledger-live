import React from "react";
import { ValueChange } from "@ledgerhq/types-live";
import { useTrendViewModel } from "../../hooks/useTrendViewModel";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { trendPercentageBody2Styles } from "LLD/shared/trendPercentageStyles";

interface TrendProps {
  readonly valueChange: ValueChange;
}

export const Trend = ({ valueChange }: TrendProps) => {
  const { percentageText, variant } = useTrendViewModel({
    valueChange,
  });
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4" data-testid="portfolio-trend">
      <span
        className={trendPercentageBody2Styles({ variant })}
        data-testid="portfolio-trend-percentage"
      >
        {percentageText}
      </span>
      <span className="body-2 text-base">·</span>
      <span className="flex items-center body-2 text-base">
        {t("portfolio.today")}
        <span className="inline-flex rounded-md transition-all duration-300 ease-out group-hover:bg-base-transparent-hover">
          <ChevronRight className="text-base" />
        </span>
      </span>
    </div>
  );
};
