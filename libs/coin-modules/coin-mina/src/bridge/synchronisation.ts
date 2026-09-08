import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { MINA_BLOCK_INFO_CONCURRENCY, MINA_BLOCK_INFO_TIMEOUT } from "../consts";
import { getAccount } from "../logic/account/getAccount";
import { getDelegateAddress } from "../logic/account/getDelegateAddress";
import { getBlockInfo } from "../logic/history/getBlockInfo";
import { getTransactions } from "../logic/history/getTransactions";
import { fetchValidators, getEpochInfo, RosettaTransaction } from "../network";
import { MinaAccount, MinaAccountRaw, MinaOperation } from "../types";

export const mapRosettaTxnToOperation = async (
  accountId: string,
  address: string,
  txn: RosettaTransaction,
  blockTimestamp?: number,
): Promise<MinaOperation[]> => {
  try {
    const hash = txn.transaction.transaction_identifier.hash;
    const blockHeight = txn.block_identifier.index;
    const blockHash = txn.block_identifier.hash;
    // Prefer the timestamp already resolved once per block by the caller; only fall back
    // to a per-tx /block fetch if it is missing (keeps a single, bounded burst upstream).
    const date = new Date(
      txn.timestamp ??
        blockTimestamp ??
        (await getBlockInfo(blockHeight, MINA_BLOCK_INFO_TIMEOUT)).block.timestamp,
    );
    const memo = txn.transaction.metadata?.memo || "";

    let value = new BigNumber(0);
    let fee = new BigNumber(0);
    let accountCreationFee = new BigNumber(0);

    let fromAccount: string = "";
    let toAccount: string = "";
    let isSending = false;
    let failed = false;
    let redelegateTransaction = false;

    for (const op of txn.transaction.operations) {
      failed = failed || op.status === "Failed";
      const opValue = failed ? new BigNumber(0) : new BigNumber(op.amount?.value ?? 0);
      switch (op.type) {
        case "fee_payment": {
          fee = fee.plus(opValue.times(-1));
          continue;
        }
        case "payment_receiver_inc": {
          toAccount = op.account.address;
          value = value.plus(opValue);
          continue;
        }
        case "payment_source_dec": {
          fromAccount = op.account.address;
          if (fromAccount === address) {
            isSending = true;
          }
          continue;
        }
        case "zkapp_fee_payer_dec": {
          fromAccount = op.account.address;
          continue;
        }
        case "zkapp_balance_update": {
          toAccount = op.account.address;
          value = value.plus(opValue);
          continue;
        }
        case "delegate_change": {
          fromAccount = op.account.address;
          toAccount = op.metadata?.delegate_change_target || toAccount || "unknown";
          redelegateTransaction = true;
          continue;
        }
        case "account_creation_fee_via_payment": {
          accountCreationFee = opValue.times(-1);
          continue;
        }
      }
    }

    invariant(fromAccount, "mina: missing fromAccount");
    invariant(toAccount, "mina: missing toAccount");

    const nonce = txn.transaction.metadata?.nonce;
    const op: MinaOperation = {
      id: "",
      type: "NONE",
      hash,
      value,
      fee,
      blockHeight,
      hasFailed: failed,
      blockHash,
      accountId,
      senders: [fromAccount],
      recipients: [toAccount],
      date,
      transactionSequenceNumber: nonce === undefined ? undefined : new BigNumber(nonce),
      extra: {
        memo,
        accountCreationFee: accountCreationFee.toString(),
      },
    };

    const ops: MinaOperation[] = [];
    if (isSending) {
      const type = "OUT";
      ops.push({
        ...op,
        value: value.minus(accountCreationFee).plus(fee),
        type,
        id: encodeOperationId(accountId, hash, type),
      });
    } else if (redelegateTransaction) {
      // delegate change — if sender delegates to themselves, it's an undelegate. Otherwise the
      // chain only says the account now delegates; whether that starts or switches a delegation
      // is settled by refineDelegationTypes, which sees the whole history.
      const type = fromAccount === toAccount ? "UNDELEGATE" : "DELEGATE";
      ops.push({
        ...op,
        value: new BigNumber(0),
        type,
        id: encodeOperationId(accountId, hash, type),
      });
    } else {
      const type = "IN";
      ops.push({
        ...op,
        value: value.minus(accountCreationFee),
        type,
        id: encodeOperationId(accountId, hash, type),
      });
    }

    return ops;
  } catch (e) {
    log("error", "mina: failed to convert txn to operation", {
      error: e,
      transaction: txn,
    });
    return [];
  }
};

const DELEGATION_TYPES: ReadonlySet<OperationType> = new Set([
  "DELEGATE",
  "REDELEGATE",
  "UNDELEGATE",
]);

const sequenceNumber = (op: MinaOperation) => op.transactionSequenceNumber?.toNumber() ?? 0;

/**
 * A `delegate_change` tells who the account delegates to, never whether it already delegated,
 * so only the delegation state at that block separates a first delegation from a validator
 * switch. Rosetta history is always fetched in full, so replaying the delegation operations
 * oldest-first rebuilds that state and promotes the switches to REDELEGATE.
 */
export function refineDelegationTypes(operations: MinaOperation[]): MinaOperation[] {
  const delegations = operations
    .filter(op => DELEGATION_TYPES.has(op.type))
    .sort((a, b) => {
      const byDate = a.date.valueOf() - b.date.valueOf();
      if (byDate !== 0) return byDate;
      // Same block: the nonce is what orders two delegation changes of the same account.
      return sequenceNumber(a) - sequenceNumber(b);
    });

  let delegating = false;
  const refined = new Map<string, MinaOperation>();

  for (const op of delegations) {
    if (op.type === "UNDELEGATE") {
      // A failed change leaves the delegation untouched.
      if (!op.hasFailed) delegating = false;
      continue;
    }
    const type: OperationType = delegating ? "REDELEGATE" : "DELEGATE";
    if (!op.hasFailed) delegating = true;
    if (type !== op.type) {
      refined.set(op.id, { ...op, type, id: encodeOperationId(op.accountId, op.hash, type) });
    }
  }

  if (refined.size === 0) return operations;
  return operations.map(op => refined.get(op.id) ?? op);
}

/**
 * An operation id encodes its type, so refining a delegation type re-ids the operation. `mergeOps`
 * dedupes on the id alone, so an account synchronised before the refinement would keep its stored
 * operation next to the refined one and list the same transaction twice. Rosetta returns the whole
 * history on every sync, so a stored operation whose transaction came back under other ids only
 * exists under a stale id.
 */
export function dropSupersededOperations<T extends Operation>(
  storedOperations: T[],
  fetchedOperations: Operation[],
): T[] {
  const fetchedIds = new Set(fetchedOperations.map(op => op.id));
  const fetchedHashes = new Set(fetchedOperations.map(op => op.hash));

  return storedOperations.filter(op => fetchedIds.has(op.id) || !fetchedHashes.has(op.hash));
}

// Staking data is not on the critical path: an upstream failure must degrade it, not fail the
// whole account synchronisation (balance and operations).
const getStakingResources = async (
  address: string,
  operations: Operation[],
  previousResources: MinaAccount["resources"],
): Promise<MinaAccount["resources"]> => {
  try {
    const [delegateKey, epochInfo, validators] = await Promise.all([
      getDelegateAddress(address),
      getEpochInfo(),
      fetchValidators(),
    ]);

    // GraphQL may lag behind Rosetta. Fall back to the most recent delegation-related op
    // to determine the current delegate state without waiting for the GraphQL to catch up.
    const graphqlDelegateAddress = delegateKey || address;
    const lastDelegationOp = operations.find(
      op => op.type === "REDELEGATE" || op.type === "DELEGATE" || op.type === "UNDELEGATE",
    );
    const getDelegateAddressFn = () => {
      if (graphqlDelegateAddress !== address) return graphqlDelegateAddress;
      if (lastDelegationOp?.type === "UNDELEGATE") return address;
      return lastDelegationOp?.recipients[0] ?? address;
    };
    const delegateAddress = getDelegateAddressFn();

    return {
      blockProducers: validators,
      delegateInfo: validators.find(v => v.address === delegateAddress) ?? undefined,
      stakingActive: address !== delegateAddress,
      epochInfo: epochInfo.data.daemonStatus.consensusTimeNow,
    };
  } catch (error) {
    log("warn", "mina: failed to fetch staking resources, keeping the previous ones", { error });
    return previousResources;
  }
};

export const getAccountShape: GetAccountShape<MinaAccount> = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { blockHeight, balance, spendableBalance } = await getAccount(address);

  const rosettaTxns = await getTransactions(address);

  // Rosetta /search/transactions does not return per-tx timestamps, so operation dates come
  // from /block. Resolve each unique block once, with bounded concurrency, to avoid firing one
  // unbounded /block request per transaction (which overwhelms the node on busy accounts).
  const uniqueBlockHeights = [...new Set(rosettaTxns.map(t => t.block_identifier.index))];
  const blockTimestamps = new Map<number, number>();
  await promiseAllBatched(MINA_BLOCK_INFO_CONCURRENCY, uniqueBlockHeights, async height => {
    try {
      const info = await getBlockInfo(height, MINA_BLOCK_INFO_TIMEOUT);
      blockTimestamps.set(height, info.block.timestamp);
    } catch (e) {
      // Non-fatal: mapRosettaTxnToOperation falls back to a per-tx fetch for this block.
      log("warn", `mina: failed to resolve block timestamp for ${height}`, { e });
    }
  });

  const newOperations = await Promise.all(
    rosettaTxns.map(t =>
      mapRosettaTxnToOperation(
        accountId,
        address,
        t,
        blockTimestamps.get(t.block_identifier.index),
      ),
    ),
  );

  const fetchedOperations = refineDelegationTypes(newOperations.flat());
  const operations = mergeOps(
    dropSupersededOperations(oldOperations, fetchedOperations),
    fetchedOperations,
  );

  const resources = await getStakingResources(address, operations, initialAccount?.resources);

  const shape: Partial<MinaAccount> = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    ...(resources ? { resources } : {}),
  };

  return { ...shape, operations };
};

export function assignToAccountRaw(account: MinaAccount, accountRaw: MinaAccountRaw): void {
  if (account.resources) {
    accountRaw.resources = account.resources;
  }
}

export function assignFromAccountRaw(accountRaw: MinaAccountRaw, account: MinaAccount): void {
  const resourcesRaw = accountRaw.resources;
  if (resourcesRaw) {
    account.resources = resourcesRaw;
  }
}

export const sync = makeSync({ getAccountShape });
