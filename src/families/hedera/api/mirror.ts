import BigNumber from "bignumber.js";
import network from "../../../network";
import URL from "url";
import { getAccountBalance } from "./network";
import { Operation, OperationType } from "../../../types";
import { encodeOperationId } from "../../../operation";
import { AccountId } from "@hashgraph/sdk";
import { getEnv } from "../../../env";

const getMirrorApiUrl = (): string => getEnv("API_HEDERA_MIRROR");

const fetch = (path, query = {}) =>
  network({
    type: "get",
    url: URL.format({
      pathname: `${getMirrorApiUrl()}/api/v1${path}`,
      query,
    }),
  });

export interface Account {
  accountId: AccountId;
  balance: BigNumber;
}

export async function getAccountsForPublicKey(
  publicKey: string
): Promise<Account[]> {
  const r = await fetch("/accounts", { "account.publicKey": publicKey });
  const rawAccounts = r.data.accounts;
  const accounts: Account[] = [];

  for (const raw of rawAccounts) {
    const accountBalance = await getAccountBalance(raw.account);

    accounts.push({
      accountId: AccountId.fromString(raw.account),
      balance: accountBalance.balance,
    });
  }

  return accounts;
}

interface HederaMirrorTransaction {
  transfers: HederaMirrorTransfer[];
  charged_tx_fee: string;
  transaction_hash: string;
  consensus_timestamp: string;
}

interface HederaMirrorTransfer {
  account: string;
  amount: number;
}

export async function getOperationsForAccount(
  ledgerAccountId: string,
  accountId: AccountId,
  _atMost: number
): Promise<Operation[]> {
  const operations: Operation[] = [];
  const address = accountId.toString();
  const r = await fetch("/transactions", { "account.id": address });
  const rawOperations = r.data.transactions as HederaMirrorTransaction[];

  for (const raw of rawOperations) {
    const timestamp = new Date(
      parseInt(raw.consensus_timestamp.split(".")[0], 10) * 1000
    );
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

    operations.push({
      value,
      date: timestamp,
      blockHeight: 1,
      // NOTE: not sure what to put here, there are no "blocks" in hedera
      blockHash: raw.transaction_hash,
      extra: {},
      fee,
      // NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
      hash: raw.transaction_hash.replace(/\//g, "_").replace(/\+/g, "-"),
      recipients,
      senders,
      accountId: ledgerAccountId,
      id: encodeOperationId(address, raw.transaction_hash, type),
      type,
    });
  }

  return operations;
}
