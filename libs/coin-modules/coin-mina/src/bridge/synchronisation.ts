import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { MINA_BLOCK_INFO_CONCURRENCY, MINA_BLOCK_INFO_TIMEOUT } from "../consts";
import { getAccount } from "../logic/account/getAccount";
import { getDelegateAddress } from "../logic/account/getDelegateAddress";
import { getBlockInfo } from "../logic/history/getBlockInfo";
import { getTransactions } from "../logic/history/getTransactions";
import { fetchValidators, getEpochInfo, RosettaTransaction } from "../network";
import { MinaAccount, MinaAccountRaw, MinaOperation } from "../types";

/**
 * Runs `worker` over `items` with at most `limit` concurrent executions, avoiding the
 * unbounded `Promise.all` burst that overwhelms the node on accounts with many transactions.
 */
async function runWithConcurrency<T>(
  limit: number,
  items: T[],
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

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
      // delegate change — if sender delegates to themselves, it's an undelegate
      const type = fromAccount === toAccount ? "UNDELEGATE" : "REDELEGATE";
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
  await runWithConcurrency(MINA_BLOCK_INFO_CONCURRENCY, uniqueBlockHeights, async height => {
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

  const operations = mergeOps(oldOperations, newOperations.flat());

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
