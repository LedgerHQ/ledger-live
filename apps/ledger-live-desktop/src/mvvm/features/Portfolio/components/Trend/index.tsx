import React from "react";
import { ValueChange } from "@ledgerhq/types-live";
import { useTrendViewModel } from "../../hooks/useTrendViewModel";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import { trendPercentageBody2Styles } from "LLD/shared/trendPercentageStyles";

type TrendProps = Readonly<{
  valueChange: ValueChange;
  suffixLabel?: string;
  className?: string;
  testId?: string;
  percentageTestId?: string;
}>;

export const Trend = ({
  valueChange,
  suffixLabel,
  className,
  testId = "portfolio-trend",
  percentageTestId = "portfolio-trend-percentage",
}: TrendProps) => {
  const { percentageText, variant } = useTrendViewModel({
    valueChange,
  });
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-4", className)} data-testid={testId}>
      <span
        className={trendPercentageBody2Styles({ variant })}
        data-testid={percentageTestId}
      >
        {percentageText}
      </span>
      <span className="body-2 text-base">·</span>
      {suffixLabel != null ? (
        <span className="body-2 text-base">{suffixLabel}</span>
      ) : (
        <span className="flex items-center body-2 text-base">
          {t("portfolio.today")}
          <span className="inline-flex rounded-md transition-all duration-300 ease-out group-hover:bg-base-transparent-hover">
            <ChevronRight className="text-base" />
          </span>
        </span>
      )}
    </div>
  );
};
