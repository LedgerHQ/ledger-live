import BigNumber from "bignumber.js";
import network from "../../../network";
import URL from "url";
import { getAccountBalance } from "./network";
import { Operation, OperationType } from "../../../types";
import { encodeOperationId } from "../../../operation";
import { AccountId } from "@hashgraph/sdk";

const fetch = (path, query = {}) =>
  network({
    type: "get",
    url: URL.format({
      pathname: `https://mainnet-public.mirrornode.hedera.com/api/v1${path}`,
      query,
    }),
  });

export interface Account {
  accountId: AccountId;
  balance: BigNumber;
}

export async function getAccountsForPublicKey(publicKey: string): Promise<Account[]> {
  let r = await fetch("/accounts", { "account.publicKey": publicKey });
  let rawAccounts = r.data.accounts;
  let accounts: Account[] = [];

  for (let raw of rawAccounts) {
    let accountBalance = await getAccountBalance(raw.account);

    accounts.push({
      accountId: AccountId.fromString(raw.account),
      balance: accountBalance.balance,
    });
  }

  return accounts;
}

interface HederaMirrorTransaction {
  transfers: HederaMirrorTransfer[],
  charged_tx_fee: string;
  transaction_hash: string;
  consensus_timestamp: string;
}

interface HederaMirrorTransfer {
  account: string;
  amount: number;
}

export async function getOperationsForAccount(ledgerAccountId: string, accountId: AccountId, atMost: number): Promise<Operation[]> {
  let operations: Operation[] = [];
  let address = accountId.toString();
  let r = await fetch("/transactions", { "account.id": address });
  let rawOperations = r.data.transactions as HederaMirrorTransaction[];

  for (let raw of rawOperations) {
    let timestamp = new Date(parseInt(raw.consensus_timestamp.split(".")[0], 10) * 1000);
    let value = new BigNumber(0);
    let senders: string[] = [];
    let recipients: string[] = [];
    let type: OperationType = "NONE";
    let fee = new BigNumber(raw.charged_tx_fee);

    for (let transfer of raw.transfers) {
      let amount = new BigNumber(transfer.amount);

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
        recipients.push(transfer.account);
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
      hash: raw.transaction_hash,
      recipients,
      senders,
      accountId: ledgerAccountId,
      id: encodeOperationId(address, raw.transaction_hash, type),
      type,
    });
  }

  return operations;
}
