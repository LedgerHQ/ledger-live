import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { DeeplinkHandler } from "../types";

export const addAccountHandler: DeeplinkHandler<"add-account"> = (
  route,
  { openAddAccountFlow, openAssetFlow },
) => {
  const { currency } = route;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const foundCurrency = findCryptoCurrencyByKeyword(
    typeof currency === "string" ? currency?.toUpperCase() : "",
  );

  if (foundCurrency) {
    openAddAccountFlow(foundCurrency, true);
  } else {
    // No currency or unknown currency: open Add Account modal so user can select one
    openAssetFlow();
  }
};
