import { ScreenName } from "~/const";

export type AssetDetailNavigatorParamsList = {
  [ScreenName.AssetDetail]: {
    currencyId: string;
    source?: string;
  };
};
