import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import { AssetType, CreateAssetConfigurationHook } from "../utils/type";
import { useLeftApyModule } from "../hooks/modules/useLeftApyModule";
import { useRightBalanceAsset } from "../hooks/useRightBalanceAsset";
import { useLeftMarketTrendModule } from "../hooks/modules/useLeftMarketTrendModule";
import { useRightMarketTrendModule } from "../hooks/modules/useRightMarketTrendModule";

const createAssetConfigurationHook: CreateAssetConfigurationHook =
  deps =>
  ({ assetsConfiguration }) => {
    const { rightElement, leftElement } = assetsConfiguration ?? {};

    return (assets: CryptoOrTokenCurrency[]) => {
      const rightBalance = useRightBalanceAsset({
        assets,
        useBalanceDeps: deps.useBalanceDeps,
        balanceItem: deps.balanceItem,
        assetsMap: deps.assetsMap,
        enabled: rightElement === "balance" || !rightElement,
      });

      const rightMarketTrend = useRightMarketTrendModule({
        currencies: assets,
        useBalanceDeps: deps.useBalanceDeps,
        MarketPriceIndicator: deps.MarketPriceIndicator,
        enabled: rightElement === "marketTrend",
      });

      const leftApy = useLeftApyModule(assets, deps.ApyIndicator, leftElement === "apy");

      const leftMarketTrend = useLeftMarketTrendModule(
        assets,
        deps.MarketPercentIndicator,
        leftElement === "marketTrend",
      );

      return useMemo(
        () =>
          assets.map((asset, index) => {
            const getRightData = (): AssetType | undefined => {
              if (rightElement === "marketTrend") return rightMarketTrend?.[index];
              return rightBalance?.[index];
            };

            const getLeftData = (): AssetType | undefined => {
              if (leftElement === "apy") return leftApy?.[index];
              if (leftElement === "marketTrend") return leftMarketTrend?.[index];
              return undefined;
            };

            const rightData = getRightData();
            const leftData = getLeftData();

            return {
              ...asset,
              leftElement: leftData?.leftElement,
              rightElement: rightData?.rightElement,
            };
          }),
        [assets, rightBalance, rightMarketTrend, leftApy, leftMarketTrend],
      );
    };
  };

export default createAssetConfigurationHook;
