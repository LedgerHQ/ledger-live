import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  AccountTuple,
  getAccountTuplesForCurrency,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { BaseRawDetailedAccount } from "@ledgerhq/live-common/modularDrawer/types/detailedAccount";
import { useDetailedAccountsCore } from "@ledgerhq/live-common/modularDrawer/hooks/useDetailedAccountsCore";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useModularDialogAnalytics } from "../analytics/useModularDialogAnalytics";
import { MODULAR_DIALOG_PAGE_NAME } from "../analytics/modularDialog.types";
import { useOpenAssetFlowDialog } from "./useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import orderBy from "lodash/orderBy";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void,
) => {
  const { trackModularDialogEvent } = useModularDialogAnalytics();
  const counterValuesState = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const source = useSelector(modularDrawerSourceSelector);
  const { openAddAccountFlow } = useOpenAssetFlowDialog(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    source,
  );

  // Wrapper to close the drawer after account selection (from Dialog)
  const wrappedOnAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      if (onAccountSelected) {
        onAccountSelected(account, parentAccount);
        setDrawer();
      }
    },
    [onAccountSelected],
  );

  const nestedAccounts = useSelector(accountsSelector);

  const isATokenCurrency = useMemo(() => isTokenCurrency(asset), [asset]);

  const accounts = useMemo(() => {
    const accountTuples = getAccountTuplesForCurrency(asset, nestedAccounts);
    return orderBy(accountTuples, [(tuple: AccountTuple) => tuple.account.balance], ["desc"]);
  }, [asset, nestedAccounts]);

  const overridedAccountName = useBatchMaybeAccountName(accounts.map(({ account }) => account));

  // Use the shared core hook for detailed accounts logic
  const { createBaseDetailedAccounts } = useDetailedAccountsCore(
    counterValuesState,
    counterValueCurrency,
  );

  const detailedAccounts: BaseRawDetailedAccount[] = useMemo(() => {
    const accountNameMap: Record<string, string> = {};
    for (const [index, { account }] of accounts.entries()) {
      const name = overridedAccountName[index];
      if (name) {
        accountNameMap[account.id] = name;
      }
    }

    return createBaseDetailedAccounts({
      asset,
      accountTuples: accounts,
      accountNameMap,
      isTokenCurrency: isATokenCurrency,
    });
  }, [accounts, isATokenCurrency, overridedAccountName, createBaseDetailedAccounts, asset]);

  const onAddAccountClick = useCallback(() => {
    trackModularDialogEvent("button_clicked", {
      button: "Add a new account",
      page: MODULAR_DIALOG_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
    });
    openAddAccountFlow(asset, false, wrappedOnAccountSelected);
  }, [asset, openAddAccountFlow, trackModularDialogEvent, wrappedOnAccountSelected]);

  return { detailedAccounts, accounts, onAddAccountClick };
};
