import { accountToWalletAPIAccount, resolveWalletApiSpendableBalance } from "../converters";
import { getParentAccount } from "../../account";
import type { WalletAPIAccount } from "../types";
import type { HandlerDeps } from "./types";

export function createAccountListHandler(getDeps: () => HandlerDeps) {
  return async ({ currencyIds }: { currencyIds?: string[] }) => {
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

    const filteredAccounts = accounts.filter(account => {
      const accountCurrencyId =
        account.type === "TokenAccount" ? account.token.id : account.currency.id;
      const parentCurrencyId =
        account.type === "TokenAccount" ? account.token.parentCurrencyId : account.currency.id;

      return (
        includeAllCurrencies ||
        allowedCurrencyIds.has(accountCurrencyId) ||
        tokenFamilyPrefixes.has(parentCurrencyId)
      );
    });

    const wapiAccounts = await Promise.all(
      filteredAccounts.map(async (account): Promise<WalletAPIAccount> => {
        const parentAccount = getParentAccount(account, accounts);
        const spendableBalance = await resolveWalletApiSpendableBalance(account, parentAccount);

        return {
          ...accountToWalletAPIAccount(walletState, account, parentAccount),
          spendableBalance,
        };
      }),
    );

    return wapiAccounts;
  };
}
