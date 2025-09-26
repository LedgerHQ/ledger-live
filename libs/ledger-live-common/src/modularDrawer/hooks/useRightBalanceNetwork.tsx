import { useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { BalanceUI, UseBalanceDeps, CreateBalanceItem } from "../utils/type";
import { CurrenciesByProviderId } from "../../deposit/type";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";

export type NetworkDeps = {
  balanceItem: CreateBalanceItem;
  useBalanceDeps: UseBalanceDeps;
};

type Params = {
  assets: CryptoOrTokenCurrency[];
  selectedAssetId?: string;
  currenciesByProvider?: CurrenciesByProviderId[];
  networks: CryptoOrTokenCurrency[];
};

export function createUseRightBalanceNetwork({ useBalanceDeps, balanceItem }: NetworkDeps) {
  return function useRightBalanceNetwork({
    assets: networks,
    selectedAssetId,
    currenciesByProvider,
    networks: actualNetworks,
  }: Params) {
    const { flattenedAccounts, state, counterValueCurrency } = useBalanceDeps();

    return useMemo(() => {
      if (currenciesByProvider && currenciesByProvider.length > 0) {
        const providerOfSelectedAsset = currenciesByProvider.find(provider =>
          provider.currenciesByNetwork.some(currency => currency.id === selectedAssetId),
        );

        if (providerOfSelectedAsset) {
          const pairs = networks.map(network => ({
            network,
            asset: providerOfSelectedAsset.currenciesByNetwork.find(currency =>
              currency.type === "TokenCurrency"
                ? currency.parentCurrency.id === network.id
                : currency.id === network.id,
            ),
          }));

          const validAssets = pairs.filter(p => p.asset).map(p => p.asset!);

          const allBalanceData =
            validAssets.length > 0
              ? getBalanceAndFiatValueByAssets(
                  flattenedAccounts,
                  validAssets,
                  state,
                  counterValueCurrency,
                )
              : [];

          const balanceMap = new Map(allBalanceData.map(b => [b.id, b]));

          const networkWithBalanceData = pairs.map(({ network, asset }) => {
            const balanceData: BalanceUI = asset ? balanceMap.get(asset.id) || {} : {};
            return {
              network,
              balanceData,
            };
          });

          networkWithBalanceData.sort((a, b) =>
            compareByBalanceThenFiat(a.balanceData, b.balanceData),
          );

          return networkWithBalanceData.map(({ network, balanceData }) => ({
            ...network,
            rightElement: balanceItem(balanceData),
          }));
        }
      }

      const networkBalanceData = getBalanceAndFiatValueByAssets(
        flattenedAccounts,
        actualNetworks,
        state,
        counterValueCurrency,
      );

      const balanceMap = new Map(networkBalanceData.map(b => [b.id, b]));

      const networksWithBalance = actualNetworks.map(network => {
        const balanceData: BalanceUI = balanceMap.get(network.id) || {};
        return {
          network,
          balanceData,
        };
      });

      networksWithBalance.sort((a, b) => compareByBalanceThenFiat(a.balanceData, b.balanceData));

      return networksWithBalance.map(({ network, balanceData }) => ({
        ...network,
        rightElement: balanceItem(balanceData),
      }));
    }, [
      networks,
      selectedAssetId,
      currenciesByProvider,
      flattenedAccounts,
      state,
      counterValueCurrency,
      actualNetworks,
    ]);
  };
}
