import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { ScreenName } from "~/const";
import { LandingPageUseCase } from "~/dynamicContent/types";

export type LandingPagesNavigatorParamList = {
  [ScreenName.GenericLandingPage]: { useCase: LandingPageUseCase };
  [ScreenName.LargeMoverLandingPage]: {
    currencyIds: string[];
    initialRange: KeysPriceChange;
  };
};
