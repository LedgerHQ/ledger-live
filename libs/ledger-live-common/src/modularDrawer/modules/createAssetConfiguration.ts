import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetType, CreateAssetConfigurationHook, AssetConfigurationDeps } from "../utils/type";
import { CurrenciesByProviderId } from "../../deposit/type";
import { composeHooks } from "../../utils/composeHooks";
import { createUseLeftApyModule } from "../hooks/useLeftApy";
import { createUseRightBalanceAsset } from "../hooks/useRightBalanceAsset";

const getRightElement =
  (AssetConfigurationDeps: AssetConfigurationDeps) => (rightElement: string) => {
    switch (rightElement) {
      case "balance":
        return createUseRightBalanceAsset({
          useBalanceDeps: AssetConfigurationDeps.useBalanceDeps,
          balanceItem: AssetConfigurationDeps.balanceItem,
        });
      case "marketTrend":
      case "undefined":
      default:
        return undefined;
    }
  };

const getLeftElement =
  (AssetConfigurationDeps: AssetConfigurationDeps) => (leftElement: string) => {
    switch (leftElement) {
      case "apy":
        return createUseLeftApyModule({ ApyIndicator: AssetConfigurationDeps.ApyIndicator });
      case "priceVariation":
      case "undefined":
      default:
        return undefined;
    }
  };

const createAssetConfigurationHook: CreateAssetConfigurationHook =
  deps =>
  ({ assetsConfiguration, currenciesByProvider }) => {
    const { rightElement = "undefined", leftElement = "undefined" } = assetsConfiguration ?? {};

    const rightHook = getRightElement(deps)(rightElement);
    const leftHook = getLeftElement(deps)(leftElement);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const hooks = [rightHook, leftHook].filter(Boolean) as Array<
      (
        assets: CryptoOrTokenCurrency[],
        currenciesByProvider?: CurrenciesByProviderId[],
      ) => AssetType[]
    >;

    return (assets: CryptoOrTokenCurrency[]) => {
      const composedHook = composeHooks<CryptoOrTokenCurrency, AssetType>(
        ...hooks.map(
          hook => (assets: CryptoOrTokenCurrency[]) => hook(assets, currenciesByProvider),
        ),
      );
      return composedHook(assets);
    };
  };

export default createAssetConfigurationHook;
