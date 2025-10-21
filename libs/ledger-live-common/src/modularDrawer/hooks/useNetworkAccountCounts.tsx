import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountTuplesForCurrency } from "../../utils/getAccountTuplesForCurrency";
import type { Account } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "../../wallet-api/types";

type AccountModuleParams = {
  networks: CryptoOrTokenCurrency[];
  nestedAccounts: Account[];
  accountIds: Map<string, boolean> | undefined;
  formatLabel: (count: number) => string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

export type NetworkCountItem = {
  asset: CryptoOrTokenCurrency;
  label: string;
  count: number;
};

export const useNetworkAccountCounts = ({
  networks,
  nestedAccounts,
  accountIds,
  formatLabel,
}: AccountModuleParams): NetworkCountItem[] =>
  networks.map(network => {
    const asset = network.type === "TokenCurrency" ? network.parentCurrency : network;
    const { length } = getAccountTuplesForCurrency(asset, nestedAccounts, accountIds);
    return {
      asset,
      label: formatLabel(length),
      count: length,
    };
  });
