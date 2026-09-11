import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { accountRefOf } from "~/config/account-data-setup";
import { accountNameWithDefaultSelector } from "@domain/entity-account-name";
import type { AccountBalancesInput } from "@devtools/bindings";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";

export function useAccountBalancesInputs(): AccountBalancesInput[] {
  const accounts = useSelector(shallowAccountsSelector);
  const wallet = useSelector(walletSelector);

  return useMemo(() => {
    const granularFamilies = new Set(getEnabledGenericCoinFrameworkFamilies());
    return accounts.map(account => {
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

      return {
        ref: accountRefOf(account),
        name: accountNameWithDefaultSelector(wallet.accountNames, account),
        granular: granularFamilies.has(account.currency.family),
        units,
      };
    });
  }, [accounts, wallet.accountNames]);
}
