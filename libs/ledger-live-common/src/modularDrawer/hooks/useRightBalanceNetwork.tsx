import { useMemo, type ReactNode } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { BalanceUI, UseBalanceDeps } from "../utils/type";
import { CurrenciesByProviderId } from "../../deposit/type";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";

export type NetworkDeps = {
  balanceItem: (asset: { fiatValue?: string; balance?: string }) => ReactNode;
  useBalanceDeps: UseBalanceDeps;
};

type Params = {
  assets: CryptoOrTokenCurrency[];
  selectedAssetId: string;
  currenciesByProvider: CurrenciesByProviderId[];
};

export function createUseRightBalanceNetwork({ useBalanceDeps, balanceItem }: NetworkDeps) {
  return function useRightBalanceNetwork({
    assets: networks,
    selectedAssetId,
    currenciesByProvider,
  }: Params) {
    const { flattenedAccounts, discreet, state, counterValueCurrency, locale } = useBalanceDeps();

    return useMemo(() => {
      const providerOfSelectedAsset = currenciesByProvider.find(provider =>
        provider.currenciesByNetwork.some(currency => currency.id === selectedAssetId),
      );

      if (!providerOfSelectedAsset) {
        return networks.map(network => ({
          ...network,
          rightElement: balanceItem({}),
        }));
      }

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
              discreet,
              locale,
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
        compareByBalanceThenFiat(a.balanceData, b.balanceData, discreet),
      );

      return networkWithBalanceData.map(({ network, balanceData }) => ({
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
      discreet,
      locale,
    ]);
  };
}
