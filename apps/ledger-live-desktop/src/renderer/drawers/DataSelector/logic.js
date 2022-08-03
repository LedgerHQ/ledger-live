// @flow

import { setDrawer } from "../Provider";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
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
          setDrawer();
          resolve({ account, parentAccount });
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
