import { accountToWalletAPIAccount } from "../../converters";
import { getParentAccount } from "../../../account";
import type { WalletAPIAccount } from "../../types";
import type { HandlerDeps } from "../types";

export function createAccountListHandler(getDeps: () => HandlerDeps) {
  return ({ currencyIds }: { currencyIds?: string[] }) => {
    const { walletState, manifest, accounts } = getDeps();

    const manifestCurrencyIds = manifest.currencies === "*" ? ["**"] : manifest.currencies;

    const queryCurrencyIdsSet = currencyIds ? new Set(currencyIds) : undefined;
    let effectiveCurrencyIds = manifestCurrencyIds;

    if (queryCurrencyIdsSet) {
      effectiveCurrencyIds = manifestCurrencyIds.flatMap(manifestId => {
        if (manifestId === "**") {
          return [...queryCurrencyIdsSet];
        } else if (manifestId.endsWith("/**")) {
          const family = manifestId.slice(0, -3);
          return [...queryCurrencyIdsSet].filter(qId => qId.startsWith(`${family}/`));
        } else if (queryCurrencyIdsSet.has(manifestId)) {
          return [manifestId];
        }
        return [];
      });
    }

    const allowedCurrencyIds = new Set<string>();
    const includeAllCurrencies = effectiveCurrencyIds.includes("**");
    const tokenFamilyPrefixes = new Set<string>();

    for (const id of effectiveCurrencyIds) {
      if (id === "**") {
        continue;
      } else if (id.endsWith("/**")) {
        const family = id.slice(0, -3);
        tokenFamilyPrefixes.add(family);
      } else {
        allowedCurrencyIds.add(id);
      }
    }

    const wapiAccounts = accounts.reduce<WalletAPIAccount[]>((acc, account) => {
      const parentAccount = getParentAccount(account, accounts);
      const accountCurrencyId =
        account.type === "TokenAccount" ? account.token.id : account.currency.id;
      const parentCurrencyId =
        account.type === "TokenAccount" ? account.token.parentCurrency.id : account.currency.id;

      const isAllowed =
        includeAllCurrencies ||
        allowedCurrencyIds.has(accountCurrencyId) ||
        tokenFamilyPrefixes.has(parentCurrencyId);

      if (isAllowed) {
        acc.push(accountToWalletAPIAccount(walletState, account, parentAccount));
      }

      return acc;
    }, []);

    return wapiAccounts;
  };
}
