import {
  assignFromAccountRaw as hederaAssignFromAccountRaw,
  assignToAccountRaw as hederaAssignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "@ledgerhq/coin-hedera/bridge/serialization";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import genericAccountRawAssign from "../../bridge/generic-coin-framework/accountRawAssign";

/**
 * Hedera-specific hooks that persist `hederaResources` (token association settings, delegation)
 * through the `fromAccountRaw` / `toAccountRaw` cycle — the generic coin framework pipeline is
 * family-agnostic and does not serialize it. They replace the generic hooks, so those still run
 * here to keep `stakingResources`.
 */
function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  genericAccountRawAssign.assignToAccountRaw(account, accountRaw);
  hederaAssignToAccountRaw(account, accountRaw);
}

function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  genericAccountRawAssign.assignFromAccountRaw(accountRaw, account);
  hederaAssignFromAccountRaw(accountRaw, account);
}

export default {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
