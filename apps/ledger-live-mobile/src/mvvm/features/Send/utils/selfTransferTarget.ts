import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";

export function getAccountSelfTransferTarget(
  account: AccountLike,
  transaction: unknown,
  parentAccount?: Account | null,
): BalanceTypeSelfTransferTarget | null {
  const balanceTypeConfig = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));

  return balanceTypeConfig?.getSelfTransferTarget({ account, parentAccount, transaction }) ?? null;
}

export function applyRecipientSelfTransferState<T extends object>({
  account,
  transaction,
  recipient,
  parentAccount,
}: {
  account: AccountLike;
  transaction: T;
  recipient: string;
  parentAccount?: Account | null;
}): T {
  const balanceTypeConfig = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
  if (!balanceTypeConfig) return transaction;

  const selfTransferTarget = balanceTypeConfig.getSelfTransferTarget({
    account,
    parentAccount,
    transaction,
  });
  const isSelfTransfer =
    selfTransferTarget !== null &&
    selfTransferTarget.address.toLowerCase() === recipient.toLowerCase();

  return {
    ...transaction,
    ...balanceTypeConfig.buildSelfTransferPatch({ isSelfTransfer, transaction }),
  };
}
