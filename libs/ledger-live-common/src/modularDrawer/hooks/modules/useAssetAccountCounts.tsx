import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountTuplesForCurrency } from "../../../utils/getAccountTuplesForCurrency";
import type { Account } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "../../../wallet-api/types";

type AccountModuleParams = {
  assets: CryptoOrTokenCurrency[];
  nestedAccounts: Account[];
  accountIds: Map<string, boolean> | undefined;
  formatLabel: (count: number) => string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

export type AssetCountItem = {
  asset: CryptoOrTokenCurrency;
  label: string;
  count: number;
};

export const useAssetAccountCounts = ({
  assets,
  nestedAccounts,
  accountIds,
  formatLabel,
}: AccountModuleParams): AssetCountItem[] =>
  assets
    .map(asset => {
      const { length } = getAccountTuplesForCurrency(asset, nestedAccounts, accountIds);
      return {
        asset,
        label: formatLabel(length),
        count: length,
      };
    })
    .sort((a, b) => b.count - a.count);
