import { ScreenName } from "~/const";
import { LandingPageUseCase } from "~/dynamicContent/types";

export type LandingPagesNavigatorParamList = {
  [ScreenName.GenericLandingPage]: { useCase: LandingPageUseCase };
};
