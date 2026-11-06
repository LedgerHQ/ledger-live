import { useMemo } from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { useTokensData } from "@features/platform-currencies";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";

// The CAL groups ripple, ripple_testnet and ripple_devnet under one network family
const CAL_NETWORK_FAMILY = "ripple";

export function filterTokenOptions(tokens: TokenCurrency[], account: Account): TokenCurrency[] {
  const enabledStandards: string[] = getXrpEnabledTokenStandards(account.currency.id);

  // A removed token keeps its token account, for its history, but loses its resources
  const heldTokenIds = new Set(
    (account.subAccounts ?? [])
      .filter(subAccount => !!(subAccount as XrpTokenAccount).xrpResources)
      .map(subAccount => subAccount.token.id),
  );

  return tokens.filter(token => {
    const isOnAccountNetwork = token.parentCurrencyId === account.currency.id;
    const isEnabled = enabledStandards.includes(token.tokenType);
    const isHeld = heldTokenIds.has(token.id);

    return isOnAccountNetwork && isEnabled && !isHeld;
  });
}

export function useTokenOptions(account: Account) {
  const { data, isLoading, loadNext } = useTokensData({ networkFamily: CAL_NETWORK_FAMILY });

  const options = useMemo(() => {
    return filterTokenOptions(data?.tokens ?? [], account);
  }, [data?.tokens, account]);

  return { options, isLoading, loadNext };
}
