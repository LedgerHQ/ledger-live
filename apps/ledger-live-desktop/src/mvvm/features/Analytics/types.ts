import { Currency } from "@ledgerhq/types-cryptoassets";
import { PortfolioRange } from "@ledgerhq/types-live";
import { TFunction } from "i18next";

type AnalyticsViewModel = {
  navigateToDashboard: () => void;
  counterValue: Currency;
  selectedTimeRange: PortfolioRange;
  t: TFunction;
};
export type { AnalyticsViewModel };
