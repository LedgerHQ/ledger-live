import { ScreenName } from "~/const";
import { Asset } from "~/types/asset";

export type CryptoVariant = "crypto" | "stablecoin" | "stocks" | "all";

export type CryptoScreenNavigator = {
  [ScreenName.Crypto]: {
    sourceScreenName: ScreenName;
    variant?: CryptoVariant;
  };
};

export interface CryptoScreenViewData {
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
  isLoading: boolean;
  error: Error | null;
  sourceScreenName: ScreenName | undefined;
  variant: CryptoVariant;
  trackingType: "crypto" | "stable" | "stocks" | undefined;
}
