import { type ReactNode } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { UseBalanceDeps } from "../utils/type";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";

export type NetworkDeps = {
  balanceItem: (asset: { fiatValue?: string; balance?: string }) => ReactNode;
  useBalanceDeps: UseBalanceDeps;
};

type Params = {
  networks: CryptoOrTokenCurrency[];
};

export function createUseRightBalanceNetwork({ useBalanceDeps, balanceItem }: NetworkDeps) {
  return function useRightBalanceNetwork({ networks }: Params) {
    const { flattenedAccounts, discreet, state, counterValueCurrency, locale } = useBalanceDeps();

    const networkBalanceData = getBalanceAndFiatValueByAssets(
      flattenedAccounts,
      networks,
      state,
      counterValueCurrency,
      discreet,
      locale,
    );

    const balanceMap = new Map(networkBalanceData.map(b => [b.id, b]));

    const networksWithBalance = networks.map(network => {
      const balanceData = balanceMap.get(network.id) || {};
      return {
        network,
        balanceData,
      };
    });

    networksWithBalance.sort((a, b) =>
      compareByBalanceThenFiat(a.balanceData, b.balanceData, discreet),
    );

    return networksWithBalance.map(({ network, balanceData }) => ({
      ...network,
      rightElement: balanceItem(balanceData),
    }));
  };
}
