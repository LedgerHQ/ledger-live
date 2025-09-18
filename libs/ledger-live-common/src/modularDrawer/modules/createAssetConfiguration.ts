import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetType, CreateAssetConfigurationHook, AssetConfigurationDeps } from "../utils/type";
import { CurrenciesByProviderId } from "../../deposit/type";
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
  ({ assetsConfiguration, currenciesByProvider }) => {
    const { rightElement, leftElement } = assetsConfiguration ?? {};

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
