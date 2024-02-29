import { setDrawer } from "../Provider";
import { Account, AccountLike } from "@ledgerhq/types-live";
import SelectAccountAndCurrencyDrawer from "./SelectAccountAndCurrencyDrawer";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
type SelectAccountAndCurrencyResult = {
  account: AccountLike;
  parentAccount?: Account;
};
export function selectAccountAndCurrency(
  currencies?: string[],
  includeTokens?: boolean,
): Promise<SelectAccountAndCurrencyResult> {
  return new Promise((resolve, reject) => {
    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencies: listAndFilterCurrencies({
          currencies,
          includeTokens,
        }),
        onAccountSelected: (account, parentAccount) => {
          setDrawer();
          resolve({
            account,
            parentAccount,
          });
        },
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
