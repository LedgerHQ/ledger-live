import React from "react";
import { ValueChange } from "@ledgerhq/types-live";
import { cva } from "class-variance-authority";
import { useTrendViewModel } from "../../hooks/useTrendViewModel";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";

const percentStyles = cva("body-2", {
  variants: {
    variant: {
      positive: "text-success",
      negative: "text-error",
      neutral: "text-muted",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

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
      <span className={percentStyles({ variant })} data-testid="portfolio-trend-percentage">
        {percentageText}
      </span>
      <span className="body-2 text-base">·</span>
      <span className="flex items-center body-2 text-base">
        {t("portfolio.today")}
        <ChevronRight className="text-base" />
      </span>
    </div>
  );
};
