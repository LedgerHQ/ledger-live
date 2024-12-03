import { ScreenName } from "~/const";

export type AssetsListNavigator = {
  [ScreenName.AssetsList]: {
    sourceScreenName: ScreenName;
    showHeader?: boolean;
    isSyncEnabled?: boolean;
  };
};
