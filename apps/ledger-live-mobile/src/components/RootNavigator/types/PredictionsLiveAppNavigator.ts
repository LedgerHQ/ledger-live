import { ScreenName } from "~/const";

export type PredictionsLiveAppNavigatorParamList = {
  [ScreenName.Predictions]: Record<string, string> | undefined;
};
