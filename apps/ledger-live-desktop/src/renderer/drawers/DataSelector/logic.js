// @flow

import { setDrawer } from "../Provider";
import { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import SelectCurrencyDrawer from "./SelectCurrencyDrawer";
import SelectAccountDrawer from "./SelectAccountDrawer";
import SelectAccountAndCurrencyDrawer from "./SelectAccountAndCurrencyDrawer";

type SelectAccountAndCurrencyResult = {
  account: AccountLike,
  parentAccount?: Account,
};

export function selectAccountAndCurrency(
  currencies?: string[],
  includeTokens?: boolean,
): Promise<SelectAccountAndCurrencyResult> {
  return new Promise((resolve, reject) => {
    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencies,
        includeTokens,
        onAccountSelected: (account, parentAccount) => {
          setDrawer(undefined);
          resolve({ account, parentAccount });
        },
      },
      {
        onRequestClose: () => {
          console.log("ULTRA REQUEST CLOSE");
          setDrawer(undefined);
          reject(new Error("Canceled by user"));
        },
      },
    );
  });
}
