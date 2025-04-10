import { Account, AccountLike } from "@ledgerhq/types-live";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

import SelectCurrencyDrawer from "../components/SelectCurrencyDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";
type SelectAccountAndCurrencyResult = {
  account: AccountLike;
  parentAccount?: Account;
};
export function selectCurrency(
  currencies?: string[],
  includeTokens?: boolean,
): Promise<SelectAccountAndCurrencyResult> {
  return new Promise((_resolve, reject) => {
    setDrawer(
      SelectCurrencyDrawer,
      {
        currencies: listAndFilterCurrencies({
          currencies,
          includeTokens,
        }),
        onAssetSelected: () => setDrawer(),
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
