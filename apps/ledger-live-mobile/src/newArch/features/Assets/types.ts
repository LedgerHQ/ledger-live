import { ScreenName } from "~/const";
import { AssetsListNavigator } from "./screens/AssetsList/types";

export type AssetsNavigatorParamsList = {
  [ScreenName.AssetsList]: AssetsListNavigator[ScreenName.AssetsList];
};
