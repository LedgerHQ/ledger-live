import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { AccountTuple, getAccountTuplesForCurrency } from "../utils/getAccountTuplesForCurrency";
import { accountsSelector } from "~/reducers/accounts";
import orderBy from "lodash/orderBy";

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);
  const accounts = useMemo(() => {
    const accountTuples = getAccountTuplesForCurrency(asset, nestedAccounts, accountIds);
    return orderBy(accountTuples, [(tuple: AccountTuple) => tuple.account.balance], ["desc"]);
  }, [asset, nestedAccounts, accountIds]);

  return { accounts };
};
