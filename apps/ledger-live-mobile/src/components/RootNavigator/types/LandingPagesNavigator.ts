import { ScreenName } from "~/const";
import { LandingPageUseCase } from "~/dynamicContent/types";

export enum InitialRange {
  Day = "day",
  Week = "week",
  Month = "month",
  Year = "year",
}

export type LargeMoverLandingPageParams = {
  currencyIds: string;
  initialRange?: InitialRange;
  ledgerIds?: string;
};

export type LandingPagesNavigatorParamList = {
  [ScreenName.GenericLandingPage]: { useCase: LandingPageUseCase };
  [ScreenName.LargeMoverLandingPage]: LargeMoverLandingPageParams;
  [ScreenName.MarketList]: undefined;
};
