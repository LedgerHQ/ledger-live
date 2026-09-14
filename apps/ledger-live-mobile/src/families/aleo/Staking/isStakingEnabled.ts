import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { AleoAccount, AleoCoinConfig } from "@ledgerhq/live-common/families/aleo/types";

// The section is absent, not disabled, while the config flag is off, so staking stays
// unreachable from the account page.
export function isStakingEnabled(account: AleoAccount): boolean {
  try {
    return !!getCurrencyConfiguration<AleoCoinConfig>(account.currency.id)?.enableStaking;
  } catch {
    return false;
  }
}
