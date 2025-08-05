import BigNumber from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import network from "@ledgerhq/live-network/network";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { base64ToUrlSafeBase64 } from "../bridge/utils";
import { HederaAddAccountError } from "../errors";
import type { HederaOperationExtra } from "../types";
import type { HederaMirrorAccount, HederaMirrorTransaction } from "./types";

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

  // WARNING: don't break the loop when `transactions` array is empty but `links.next` is present
  // the mirror node API enforces a 60-day max time range per query, even if `timestamp` param is set
  // see: https://hedera.com/blog/changes-to-the-hedera-operated-mirror-node
  while (nextUrl) {
    const res = await fetch(nextUrl);
    const newTransactions = res.data.transactions as HederaMirrorTransaction[];
    transactions.push(...newTransactions);
    nextUrl = res.data.links.next;
  }

  return transactions;
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
            // account is a node, only add to list if we have none
            if (recipients.length === 0) {
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

    // NOTE: earlier addresses are the "fee" addresses
    recipients.reverse();
    senders.reverse();

    const hash = base64ToUrlSafeBase64(raw.transaction_hash);

    operations.push({
      value,
      date: timestamp,
      // NOTE: there are no "blocks" in hedera
      // Set a value just so that it's considered confirmed according to isConfirmedOperation
      blockHeight: 5,
      blockHash: null,
      extra: {
        consensusTimestamp: consensus_timestamp,
        transactionId: transaction_id,
      } satisfies HederaOperationExtra,
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
