import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getAccountTuplesForCurrency } from "../../utils/getAccountTuplesForCurrency";
import type { Account } from "@ledgerhq/types-live";

type AccountModuleParams = {
  networks: CryptoOrTokenCurrency[];
  nestedAccounts: Account[];
  formatLabel: (count: number) => string;
};

export type NetworkCountItem = {
  asset: CryptoOrTokenCurrency;
  label: string;
  count: number;
};

export const useNetworkAccountCounts = ({
  networks,
  nestedAccounts,
  formatLabel,
}: AccountModuleParams): NetworkCountItem[] =>
  networks.map(network => {
    const asset =
      network.type === "TokenCurrency" ? getCryptoCurrencyById(network.parentCurrencyId) : network;
    const { length } = getAccountTuplesForCurrency(asset, nestedAccounts);
    return {
      asset,
      label: formatLabel(length),
      count: length,
    };
  });
