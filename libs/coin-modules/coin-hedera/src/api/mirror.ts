import { AccountId } from "@hashgraph/sdk";
import network from "@ledgerhq/live-network/network";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { base64ToUrlSafeBase64 } from "../bridge/utils";
import { HederaAddAccountError } from "../errors";
import { getMemo } from "../logic";
import type { HederaOperationExtra } from "../types";
import type { HederaMirrorAccount, HederaMirrorNode } from "./types";

const getMirrorApiUrl = (): string => getEnv("API_HEDERA_MIRROR");

const fetch = (path: string) => {
  return network({
    method: "GET",
    url: `${getMirrorApiUrl()}${path}`,
  });
};

export async function getAccountsForPublicKey(publicKey: string): Promise<HederaMirrorAccount[]> {
  let r;
  try {
    r = await fetch(`/api/v1/accounts?account.publicKey=${publicKey}&balance=true&limit=100`);
  } catch (e: any) {
    if (e.name === "LedgerAPI4xx") return [];
    throw e;
  }

  const accounts = r.data.accounts as HederaMirrorAccount[];

  return accounts;
}

export async function getAccount(address: string): Promise<HederaMirrorAccount> {
  try {
    const res = await fetch(`/api/v1/accounts/${address}`);
    const account = res.data as HederaMirrorAccount;

    return account;
  } catch (error) {
    if (error instanceof LedgerAPI4xx && "status" in error && error.status === 404) {
      throw new HederaAddAccountError();
    }

    throw error;
  }
}

interface HederaMirrorTransfer {
  account: string;
  amount: number;
}

export interface HederaMirrorTransaction {
  transfers: HederaMirrorTransfer[];
  staking_reward_transfers: HederaMirrorTransfer[];
  name: "CRYPTOUPDATEACCOUNT";
  memo_base64: string | null;
  charged_tx_fee: string;
  transaction_hash: string;
  consensus_timestamp: string;
  transaction_id: string;
}

export async function getAccountTransactions(
  address: string,
  since: string | null,
): Promise<HederaMirrorTransaction[]> {
  const transactions: HederaMirrorTransaction[] = [];
  const params = new URLSearchParams({
    "account.id": address,
    order: "desc",
    limit: "100",
  });

  if (since) {
    params.append("timestamp", `gt:${since}`);
  }

  let nextUrl = `/api/v1/transactions?${params.toString()}`;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    const newTransactions = res.data.transactions as HederaMirrorTransaction[];
    if (newTransactions.length === 0) break;
    transactions.push(...newTransactions);
    nextUrl = res.data.links.next;
  }

  return transactions;
}

export async function getNodes(): Promise<HederaMirrorNode[]> {
  const nodes: HederaMirrorNode[] = [];
  const params = new URLSearchParams({
    order: "desc",
    limit: "100",
  });

  let nextUrl = `/api/v1/network/nodes?${params.toString()}`;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    const newNodes = res.data.nodes as HederaMirrorNode[];
    nodes.push(...newNodes);
    nextUrl = res.data.links.next;
  }

  return nodes;
}

export async function getOperationsForAccount(
  ledgerAccountId: string,
  address: string,
  latestOperationTimestamp: string | null,
): Promise<Operation[]> {
  const rawOperations = await getAccountTransactions(address, latestOperationTimestamp);
  const operations: Operation[] = [];

  for (const raw of rawOperations) {
    const { consensus_timestamp, transaction_id } = raw;
    const timestamp = new Date(parseInt(consensus_timestamp.split(".")[0], 10) * 1000);
    const senders: string[] = [];
    const recipients: string[] = [];
    const fee = new BigNumber(raw.charged_tx_fee);
    let value = new BigNumber(0);
    let type: OperationType = "NONE";
    const isUpdateAccountTx = raw.name === "CRYPTOUPDATEACCOUNT";

    for (let i = raw.transfers.length - 1; i >= 0; i--) {
      const transfer = raw.transfers[i];
      const amount = new BigNumber(transfer.amount);
      const account = AccountId.fromString(transfer.account);

      if (transfer.account === address) {
        if (amount.isNegative()) {
          value = amount.abs();
          type = "OUT";
        } else {
          value = amount;
          type = "IN";
        }
      }

      if (amount.isNegative()) {
        senders.push(transfer.account);
      } else {
        if (account.shard.eq(0) && account.realm.eq(0)) {
          if (account.num.lt(100)) {
            // account is a node, only add to list if we have none or it's an update account transaction
            if (isUpdateAccountTx || recipients.length === 0) {
              recipients.push(transfer.account);
            }
          } else if (account.num.lt(1000)) {
            // account is a system account that is not a node
            // do NOT add
          } else {
            recipients.push(transfer.account);
          }
        } else {
          recipients.push(transfer.account);
        }
      }
    }

    if (isUpdateAccountTx) {
      type = "UPDATE_ACCOUNT";
    }

    const stakingReward = raw.staking_reward_transfers.reduce((acc, transfer) => {
      const transferAmount = new BigNumber(transfer.amount);

      if (transfer.account === address) {
        acc = acc.plus(transferAmount);
      }

      return acc;
    }, new BigNumber(0));

    // NOTE: earlier addresses are the "fee" addresses
    recipients.reverse();
    senders.reverse();

    const hash = base64ToUrlSafeBase64(raw.transaction_hash);
    // NOTE: there are no "blocks" in hedera, set a value just so that it's considered confirmed according to isConfirmedOperation
    const blockHeight = 5;
    const blockHash = null;
    const extra = {
      memo: getMemo(raw),
      consensusTimestamp: consensus_timestamp,
      transactionId: transaction_id,
    } satisfies HederaOperationExtra;

    if (stakingReward.gt(0)) {
      // offset timestamp by +1s to ensure it appears just before the triggering operation in the list
      const stakingRewardTimestamp = new Date(timestamp.getTime() + 1000);
      const stakingRewardHash = `${hash}-staking-reward`;
      const stakingRewardType: OperationType = "REWARD";

      operations.push({
        value: stakingReward,
        date: stakingRewardTimestamp,
        blockHeight,
        blockHash,
        extra,
        fee: new BigNumber(0),
        hash: stakingRewardHash,
        recipients: [address],
        senders: [getEnv("HEDERA_STAKING_REWARD_ACCOUNT_ID")],
        accountId: ledgerAccountId,
        id: encodeOperationId(ledgerAccountId, stakingRewardHash, stakingRewardType),
        type: stakingRewardType,
      });
    }

    operations.push({
      value,
      date: timestamp,
      blockHeight,
      blockHash,
      extra,
      fee,
      hash,
      recipients,
      senders,
      accountId: ledgerAccountId,
      id: encodeOperationId(ledgerAccountId, hash, type),
      type,
    });
  }

  return operations;
}
