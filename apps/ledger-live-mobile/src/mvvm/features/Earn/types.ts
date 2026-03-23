import { ScreenName } from "~/const";

export type EarnSimulatorNavigatorParamsList = {
  [ScreenName.EarnSimulator]: {
    currencyId?: string;
    apy?: number;
  };
};
