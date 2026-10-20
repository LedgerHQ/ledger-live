import {
  assignFromAccountRaw as assignStakingPositionsFromAccountRaw,
  assignToAccountRaw,
} from "@ledgerhq/coin-stacks/bridge/serialization";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { isOperationType } from "../../bridge/generic-coin-framework/utils";

/** coin-stacks used to give a synced contract call its function name as operation type; those rows
 * are stored, and a sync never refetches below the newest one. They become CONTRACT_CALL: a stored
 * row has no contract id, so a pox `stake` cannot be told apart from a user contract's `stake`
 * function, and only the former is a DELEGATE. Done on load rather than with a `syncVersion`
 * resync: a sync from scratch rebuilds the token accounts without their local `swapHistory` and
 * pending operations. */
function retypeStoredContractCalls(account: Account): void {
  for (const operation of account.operations ?? []) {
    if (!isOperationType(operation.type)) operation.type = "CONTRACT_CALL";
  }
}

function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  assignStakingPositionsFromAccountRaw(accountRaw, account);
  retypeStoredContractCalls(account);
}

/**
 * Persists `stakingPositions` through the `fromAccountRaw` / `toAccountRaw` cycle on the
 * generic-coin-framework path, which serializes no family-specific account resources. The Stake
 * action is gated on `stakingPositions !== undefined`, so dropping it on persist would hide Stake
 * after a restart until the next sync.
 *
 * Reuses the classic bridge's own hooks: its `StakingPosition` is the same shape the framework's
 * `toStakingPositionOnAccount` produces. Same pattern as `families/tezos/accountRawAssign.ts`.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
};
