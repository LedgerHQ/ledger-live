import { setDrawer } from "../Provider";
import { Account, AccountLike } from "@ledgerhq/types-live";
import SelectAccountAndCurrencyDrawer from "./SelectAccountAndCurrencyDrawer";
type SelectAccountAndCurrencyResult = {
  account: AccountLike;
  parentAccount?: Account;
};
export function selectAccountAndCurrency(
  currencyIds?: string[],
  flow?: string,
  source?: string,
): Promise<SelectAccountAndCurrencyResult> {
  return new Promise((resolve, reject) => {
    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencyIds,
        onAccountSelected: (account, parentAccount) => {
          setDrawer();
          resolve({
            account,
            parentAccount,
          });
        },
        flow,
        source,
      },
      {
        onRequestClose: () => {
          setDrawer();
          reject(new Error("Canceled by user"));
        },
      },
    );
  });
}
