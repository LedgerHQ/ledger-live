import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetType, CreateAssetConfigurationHook, AssetConfigurationDeps } from "../utils/type";
import { composeHooks } from "../../utils/composeHooks";
import { useLeftApyModule } from "../hooks/modules/useLeftApyModule";
import { createUseRightBalanceAsset } from "../hooks/useRightBalanceAsset";
import { useLeftMarketTrendModule } from "../hooks/modules/useLeftMarketTrendModule";
import { useRightMarketTrendModule } from "../hooks/modules/useRightMarketTrendModule";

const getRightElement =
  (AssetConfigurationDeps: AssetConfigurationDeps) => (rightElement?: string) => {
    switch (rightElement) {
      case "undefined":
        return undefined;
      case "marketTrend":
        return (currencies: CryptoOrTokenCurrency[]) =>
          useRightMarketTrendModule({
            currencies,
            useBalanceDeps: AssetConfigurationDeps.useBalanceDeps,
            MarketPriceIndicator: AssetConfigurationDeps.MarketPriceIndicator,
          });
      case "balance":
      default:
        return createUseRightBalanceAsset({
          useBalanceDeps: AssetConfigurationDeps.useBalanceDeps,
          balanceItem: AssetConfigurationDeps.balanceItem,
          assetsMap: AssetConfigurationDeps.assetsMap,
        });
    }
  };

const getLeftElement =
  (AssetConfigurationDeps: AssetConfigurationDeps) => (leftElement?: string) => {
    switch (leftElement) {
      case "apy":
        return (assets: CryptoOrTokenCurrency[]) =>
          useLeftApyModule(assets, AssetConfigurationDeps.ApyIndicator);
      case "marketTrend":
        return (assets: CryptoOrTokenCurrency[]) =>
          useLeftMarketTrendModule(assets, AssetConfigurationDeps.MarketPercentIndicator);
      case "undefined":
      default:
        return undefined;
    }
  };

const createAssetConfigurationHook: CreateAssetConfigurationHook =
  deps =>
  ({ assetsConfiguration }) => {
    const { rightElement, leftElement } = assetsConfiguration ?? {};

    const rightHook = getRightElement(deps)(rightElement);
    const leftHook = getLeftElement(deps)(leftElement);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const hooks = [rightHook, leftHook].filter(Boolean) as Array<
      (assets: CryptoOrTokenCurrency[]) => AssetType[]
    >;

    return (assets: CryptoOrTokenCurrency[]) => {
      if (!assets || assets.length === 0) return [];

      const composedHook = composeHooks<CryptoOrTokenCurrency, AssetType>(...hooks);
      return composedHook(assets);
    };
  };

export default createAssetConfigurationHook;
