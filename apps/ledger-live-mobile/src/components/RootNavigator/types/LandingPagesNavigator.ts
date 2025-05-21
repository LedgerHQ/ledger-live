import { ScreenName } from "~/const";
import { LandingPageUseCase } from "~/dynamicContent/types";

export enum InitialRange {
  Day = "day",
  Week = "week",
  Month = "month",
  Year = "year",
}

export type LandingPagesNavigatorParamList = {
  [ScreenName.GenericLandingPage]: { useCase: LandingPageUseCase };
  [ScreenName.LargeMoverLandingPage]: {
    currencyIds: string;
    initialRange?: InitialRange;
  };
  [ScreenName.MarketList]: undefined;
};
