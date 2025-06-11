import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useRightBalanceModule } from "./useRightBalanceModule";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { composeHooks } from "LLD/utils/composeHooks";

type Props = {
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
};

const getRightElement = (rightElement: string) => {
  switch (rightElement) {
    case "marketTrend":
    case "undefined":
      return undefined;
    case "balance":
    default:
      return useRightBalanceModule;
  }
};

const getLeftElement = (leftElement: string) => {
  switch (leftElement) {
    case "apy":
    case "priceVariation":
    case "undefined":
    default:
      return undefined;
  }
};

const createAssetConfigurationHook = ({
  assetsConfiguration,
}: Props): ((assets: CryptoOrTokenCurrency[]) => (CryptoOrTokenCurrency & AssetType)[]) => {
  const { rightElement = "balance", leftElement = "undefined" } = assetsConfiguration ?? {};

  const rightHook = getRightElement(rightElement);
  const leftHook = getLeftElement(leftElement);

  const hooks = [rightHook, leftHook].filter(Boolean) as Array<
    (assets: CryptoOrTokenCurrency[]) => AssetType[]
  >;

  return composeHooks<CryptoOrTokenCurrency, AssetType>(...hooks);
};

export default createAssetConfigurationHook;
