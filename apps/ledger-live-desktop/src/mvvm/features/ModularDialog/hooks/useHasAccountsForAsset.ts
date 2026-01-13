import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountTuplesForCurrency } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { accountsSelector } from "~/renderer/reducers/accounts";

export const useHasAccountsForAsset = (asset: CryptoOrTokenCurrency | undefined) => {
  const nestedAccounts = useSelector(accountsSelector);

  return useMemo(
    () => !asset || getAccountTuplesForCurrency(asset, nestedAccounts).length > 0,
    [asset, nestedAccounts],
  );
};
