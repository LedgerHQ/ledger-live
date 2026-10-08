import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { AccountLike } from "@ledgerhq/types-live";

/**
 * Whether the send flow asks for a balance type for this account. A currency declaring the step
 * can still offer no option for a given account (ex: an EVM token with no confidential part), and
 * then the step is skipped.
 */
export function hasBalanceTypeStepFor(account: AccountLike | undefined): boolean {
  if (!account) return false;
  const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
  return config ? config.getOptions({ account }).length > 0 : false;
}
