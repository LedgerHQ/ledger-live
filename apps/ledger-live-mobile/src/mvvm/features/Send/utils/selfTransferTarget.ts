import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";

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
