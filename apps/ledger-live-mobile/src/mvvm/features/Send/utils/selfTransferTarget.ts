import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { AccountLike } from "@ledgerhq/types-live";

export function getAccountSelfTransferTarget(
  account: AccountLike,
  transaction: unknown,
): BalanceTypeSelfTransferTarget | null {
  const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
  return config?.getSelfTransferTarget({ account, transaction }) ?? null;
}
