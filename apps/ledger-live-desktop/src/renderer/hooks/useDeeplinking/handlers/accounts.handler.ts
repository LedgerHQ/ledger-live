import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { DeeplinkHandler } from "../types";
import { getAccountsOrSubAccountsByCurrency } from "../utils";

export const accountsHandler: DeeplinkHandler<"accounts"> = (route, { accounts, navigate }) => {
  const { address } = route;

  if (address && typeof address === "string") {
    const account = accounts.find(acc => acc.freshAddress === address);
    if (account) {
      navigate(`/account/${account.id}`);
      return;
    }
  }

  navigate("/accounts");
};

export const accountHandler: DeeplinkHandler<"account"> = (route, { accounts, navigate }) => {
  const { currency, address } = route;

  if (!currency || typeof currency !== "string") return;

  const foundCurrency = findCryptoCurrencyByKeyword(currency.toUpperCase()) as Currency;
  if (!foundCurrency || foundCurrency.type === "FiatCurrency") return;

  const foundAccounts = getAccountsOrSubAccountsByCurrency(foundCurrency, accounts || []);
  if (!foundAccounts.length) return;

  // Navigate to a specific account if a valid 'address' is provided and the account currency matches the 'currency' param in the deeplink URL
  if (address && typeof address === "string") {
    const account = accounts.find(
      acc =>
        acc.freshAddress === address && acc.currency.id.toLowerCase() === currency.toLowerCase(),
    );

    if (account) {
      navigate(`/account/${account.id}`);
    }
    return;
  }

  const [chosenAccount] = foundAccounts;

  if (chosenAccount?.type === "Account") {
    navigate(`/account/${chosenAccount.id}`);
  } else {
    navigate(`/account/${chosenAccount?.parentId}/${chosenAccount?.id}`);
  }
};
