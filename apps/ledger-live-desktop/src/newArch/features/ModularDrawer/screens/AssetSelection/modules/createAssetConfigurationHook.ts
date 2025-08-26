import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { ApyIndicator, AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { composeHooks } from "@ledgerhq/live-common/utils/composeHooks";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { createUseLeftApyModule } from "@ledgerhq/live-common/modularDrawer/hooks/useLeftApy";
import { createUseRightBalanceAsset } from "@ledgerhq/live-common/modularDrawer/hooks/useRightBalanceAsset";
import { createBalanceItem, useBalanceDeps } from "../../../components/Balance";

type Props = {
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  currenciesByProvider: CurrenciesByProviderId[];
};

type CreateAssetConfigurationHook = (
  props: Props,
) => (assets: CryptoOrTokenCurrency[]) => (CryptoOrTokenCurrency & AssetType)[];

const getRightElement = (rightElement: string) => {
  switch (rightElement) {
    case "balance":
      return createUseRightBalanceAsset({
        useBalanceDeps,
        createBalanceItem,
      });
    case "marketTrend":
    case "undefined":
    default:
      return undefined;
  }
};

const getLeftElement = (leftElement: string) => {
  switch (leftElement) {
    case "apy":
      return createUseLeftApyModule({ ApyIndicator });
    case "priceVariation":
    case "undefined":
    default:
      return undefined;
  }
};

const createAssetConfigurationHook: CreateAssetConfigurationHook = ({
  assetsConfiguration,
  currenciesByProvider,
}) => {
  const { rightElement = "undefined", leftElement = "undefined" } = assetsConfiguration ?? {};

  const rightHook = getRightElement(rightElement);
  const leftHook = getLeftElement(leftElement);

  const hooks = [rightHook, leftHook].filter(Boolean) as Array<
    (
      assets: CryptoOrTokenCurrency[],
      currenciesByProvider?: CurrenciesByProviderId[],
    ) => AssetType[]
  >;

  return (assets: CryptoOrTokenCurrency[]) => {
    const composedHook = composeHooks<CryptoOrTokenCurrency, AssetType>(
      ...hooks.map(hook => (assets: CryptoOrTokenCurrency[]) => hook(assets, currenciesByProvider)),
    );
    return composedHook(assets);
  };
};

export default createAssetConfigurationHook;
