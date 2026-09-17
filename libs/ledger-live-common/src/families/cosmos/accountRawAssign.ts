import {
  assignFromAccountRaw as cosmosAssignFromAccountRaw,
  assignToAccountRaw as cosmosAssignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "@ledgerhq/coin-cosmos/serialization";
import genericAccountRawAssign from "@ledgerhq/live-common/bridge/generic-coin-framework/accountRawAssign";
import { Account, AccountRaw, isStakingAccount, isStakingAccountRaw } from "@ledgerhq/types-live";

function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  if (isStakingAccount(account)) {
    genericAccountRawAssign.assignToAccountRaw(account, accountRaw);
  } else {
    cosmosAssignToAccountRaw(account, accountRaw);
  }
}

function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  if (isStakingAccountRaw(accountRaw)) {
    genericAccountRawAssign.assignFromAccountRaw(accountRaw, account);
  } else {
    cosmosAssignFromAccountRaw(accountRaw, account);
  }
}

export default {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
