import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { UseBalanceDeps, CreateBalanceItem } from "../utils/type";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";

export type NetworkDeps = {
  balanceItem: CreateBalanceItem;
  useBalanceDeps: UseBalanceDeps;
};

type Params = {
  networks: CryptoOrTokenCurrency[];
};

export function createUseRightBalanceNetwork({ useBalanceDeps, balanceItem }: NetworkDeps) {
  return function useRightBalanceNetwork({ networks }: Params) {
    const { flattenedAccounts, state, counterValueCurrency } = useBalanceDeps();

    const networkBalanceData = getBalanceAndFiatValueByAssets(
      flattenedAccounts,
      networks,
      state,
      counterValueCurrency,
    );

    const balanceMap = new Map(networkBalanceData.map(b => [b.id, b]));

    return networks.map(network => {
      const balanceData = balanceMap.get(network.id) || {};
      const details = network.type === "TokenCurrency" ? network.parentCurrency : network;
      return {
        ...details,
        rightElement: balanceItem(balanceData),
        balanceData: balanceData,
      };
    });
  };
}
