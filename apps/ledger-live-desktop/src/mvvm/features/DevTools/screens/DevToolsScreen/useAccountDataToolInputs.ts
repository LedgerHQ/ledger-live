import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountDescriptorOf } from "@ledgerhq/live-common/account-data/accountDescriptorOf";
import { accountNameWithDefaultSelector } from "@domain/entity-account-name";
import type { AccountBalancesInput } from "@devtools/bindings";
import { coinModuleFamilies } from "~/config/account-data-setup";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";

/** The accounts the account data tools list, flagged granular when the coin module serves `datum`. */
export function useAccountDataToolInputs(
  datum: keyof typeof coinModuleFamilies,
): AccountBalancesInput[] {
  const accounts = useSelector(shallowAccountsSelector);
  const wallet = useSelector(walletSelector);

  return useMemo(() => {
    const granularFamilies = new Set(coinModuleFamilies[datum]());
    return accounts.flatMap(account => {
      // An account whose derivation is unknown has no descriptor, so no source can be asked about it.
      let descriptor;
      try {
        descriptor = accountDescriptorOf(account);
      } catch {
        return [];
      }
      const units: Record<string, { code: string; magnitude: number }> = {
        [account.currency.id]: {
          code: account.currency.units[0].code,
          magnitude: account.currency.units[0].magnitude,
        },
      };
      for (const sub of account.subAccounts ?? []) {
        if (sub.type !== "TokenAccount") continue;
        units[sub.token.id] = {
          code: sub.token.units[0].code,
          magnitude: sub.token.units[0].magnitude,
        };
      }

      return [
        {
          descriptor,
          name: accountNameWithDefaultSelector(wallet.accountNames, account),
          granular: granularFamilies.has(account.currency.family),
          units,
        },
      ];
    });
  }, [accounts, wallet.accountNames, datum]);
}
