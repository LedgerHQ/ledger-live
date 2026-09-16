import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { AccountLike } from "@ledgerhq/types-live";

/**
 * Resolves the account's self-transfer target -- its other balance pool, per the
 * send descriptor -- or `null` when the currency declares no balanceType config or
 * the account has no such target. Single-sourced so a typed/pasted self-transfer
 * address (recipient matching) is recognized the same way the self-transfer
 * shortcut recognizes its own destination.
 */
export function getAccountSelfTransferTarget(
  account: AccountLike,
  transaction: unknown,
): BalanceTypeSelfTransferTarget | null {
  const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
  return config?.getSelfTransferTarget({ account, transaction }) ?? null;
}
