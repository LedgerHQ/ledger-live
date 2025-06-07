import {
  assetsLeftElementOptions,
  assetsRightElementOptions,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type SelectAssetProps = {
  assetTypes?: AssetType[];
  assetsToDisplay: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  scrollToTop: boolean;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  onScrolledToTop?: () => void;
};

export type ElementsCombinaition =
  `${(typeof assetsLeftElementOptions)[number]}|${(typeof assetsRightElementOptions)[number]}`;
