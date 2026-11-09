import { useMemo } from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { useTokensData } from "@features/platform-currencies";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { XRP_DEV_TOKENS } from "@ledgerhq/live-common/families/xrp/devTokens";
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
    // TEMP prototype: the dev tokens stand in for the testnet tokens the CAL does not list
    const devTokenIds = new Set(XRP_DEV_TOKENS.map(token => token.id));
    const calTokens = (data?.tokens ?? []).filter(token => !devTokenIds.has(token.id));

    return filterTokenOptions([...XRP_DEV_TOKENS, ...calTokens], account);
  }, [data?.tokens, account]);

  return { options, isLoading, loadNext };
}
