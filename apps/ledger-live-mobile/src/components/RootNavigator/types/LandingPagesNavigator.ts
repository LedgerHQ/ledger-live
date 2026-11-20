import { ScreenName } from "~/const";
import { LandingPageUseCase } from "~/dynamicContent/types";
import type { MarketListRouteParams } from "LLM/features/Market/types";

export type InitialRange = "day" | "week" | "month" | "year";

export type LargeMoverLandingPageParams = {
  ledgerIds: string;
  initialRange?: InitialRange;
};

export type LandingPagesNavigatorParamList = {
  [ScreenName.GenericLandingPage]: { useCase: LandingPageUseCase };
  [ScreenName.LargeMoverLandingPage]: LargeMoverLandingPageParams;
  [ScreenName.MarketList]: MarketListRouteParams | undefined;
};
