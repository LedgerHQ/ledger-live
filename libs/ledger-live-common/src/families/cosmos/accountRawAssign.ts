import type { CosmosAccount, CosmosAccountRaw } from "@ledgerhq/coin-cosmos/types/index";
import {
  assignFromAccountRaw as cosmosAssignFromAccountRaw,
  assignToAccountRaw as cosmosAssignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "@ledgerhq/coin-cosmos/serialization";
import genericAccountRawAssign from "@ledgerhq/live-common/bridge/generic-coin-framework/accountRawAssign";
import { Account, AccountRaw, isStakingAccount } from "@ledgerhq/types-live";

// The generic staking serializer/deserializer that runs after the cosmos-specific step
// doesn't know about these legacy Cosmos-only fields, so it drops them if it runs last.
// Preserve them across that step until the generic shape can carry them itself.
function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  cosmosAssignToAccountRaw(account, accountRaw);
  const cosmosAccountRaw = accountRaw as CosmosAccountRaw;
  const { sequence, publicKey } = cosmosAccountRaw.stakingResources ?? {};

  genericAccountRawAssign.assignToAccountRaw(account, accountRaw);

  if (cosmosAccountRaw.stakingResources) {
    if (sequence !== undefined) cosmosAccountRaw.stakingResources.sequence = sequence;
    if (publicKey !== undefined) cosmosAccountRaw.stakingResources.publicKey = publicKey;
  }
}

function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  cosmosAssignFromAccountRaw(accountRaw, account);
  const cosmosAccount = account as CosmosAccount;
  const { sequence, publicKey } = cosmosAccount.stakingResources ?? {};

  genericAccountRawAssign.assignFromAccountRaw(accountRaw, account);

  if (cosmosAccount.stakingResources) {
    if (sequence !== undefined) cosmosAccount.stakingResources.sequence = sequence;
    if (publicKey !== undefined) cosmosAccount.stakingResources.publicKey = publicKey;
  }

  if (!isStakingAccount(account) && cosmosAccount.cosmosResources) {
    cosmosAccount.stakingResources = cosmosAccount.cosmosResources;
  }
}

export default {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
