import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";

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
  parentAccount?: Account | null,
): BalanceTypeSelfTransferTarget | null {
  const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
  return config?.getSelfTransferTarget({ account, parentAccount, transaction }) ?? null;
}

export function applyRecipientSelfTransferState<T extends object>(
  account: AccountLike,
  transaction: T,
  recipient: string,
  parentAccount?: Account | null,
): T {
  const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
  if (!config) return transaction;

  const target = config.getSelfTransferTarget({ account, parentAccount, transaction });
  const isSelfTransfer =
    target !== null && target.address.toLowerCase() === recipient.toLowerCase();

  return { ...transaction, ...config.buildSelfTransferPatch({ isSelfTransfer, transaction }) };
}
