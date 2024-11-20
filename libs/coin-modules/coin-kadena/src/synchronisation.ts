import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { fetchAccountBalance, fetchBlockHeight, fetchTransactions } from "./api/network";
import { Transfer } from "./api/types";
import { KadenaOperation } from "./types";
import { baseUnitToKda } from "./utils";

const getAddressFromPublicKey = (pubkey: string): string => {
  return `k:${pubkey}`;
};

export const getAccountShape: GetAccountShape = async info => {
  const { initialAccount, currency, rest = {}, derivationMode } = info;
  // for bridge tests specifically the `rest` object is empty and therefore the publicKey is undefined
  // reconciliatePublicKey tries to get pubKey from rest object and then from accountId
  const pubKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(pubKey, "publicKey is required");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: pubKey,
    derivationMode,
  });

  const address = getAddressFromPublicKey(pubKey);

  const rawTxs = await fetchTransactions(address);

  const blockHeight = await fetchBlockHeight();

  const balance = await fetchAccountBalance(address);

  const result: Partial<Account> = {
    id: accountId,
    xpub: pubKey,
    freshAddress: address,
    balance: baseUnitToKda(balance),
    spendableBalance: baseUnitToKda(balance),
    operations: rawTxsToOps(rawTxs, accountId, address),
    blockHeight,
  };

  return result;
};

function reconciliatePublicKey(
  publicKey: string | undefined,
  initialAccount: Account | undefined,
): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const rawTxsToOps = (rawTxs: Transfer[], accountId: string, address: string): KadenaOperation[] => {
  const ops: KadenaOperation[] = [];
  const txs = new Map();

  // Gather ops from the same transaction
  for (const rawTx of rawTxs) {
    let tmp = [];

    if (rawTx.moduleName !== "coin") continue;

    if (txs.has(rawTx.requestKey)) {
      tmp = txs.get(rawTx.requestKey);
    }
    tmp.push(rawTx);

    txs.set(rawTx.requestKey, tmp);
  }

  // Build ops by taking index 0 as fee and index 1 as the actual transaction
  for (const tx of txs.values()) {
    const k_op: KadenaOperation = {} as KadenaOperation;
    k_op.fee = new BigNumber(0);
    k_op.value = new BigNumber(0);

    let transaction_op: Transfer | null = null;
    let fee_op: Transfer | null = null;

    // Find minimal amount value and
    for (const op of tx) {
      if (
        !transaction_op ||
        (transaction_op && new BigNumber(transaction_op.amount) < new BigNumber(op.amount))
      ) {
        transaction_op = op;
        fee_op = fee_op ? fee_op : transaction_op;
      } else {
        fee_op = op;
      }
    }

    if (transaction_op) {
      const {
        requestKey,
        block: { creationTime, height: blockHeight, hash: blockHash },
        amount,
        senderAccount,
        receiverAccount,
        chainId,
        crossChainTransfer,
        transaction: { result },
      } = transaction_op;
      const date = new Date(creationTime);
      const value = new BigNumber(amount);
      const fee = new BigNumber(fee_op?.amount ?? 0);
      const sender =
        senderAccount && senderAccount !== "" ? senderAccount : crossChainTransfer?.senderAccount;
      const recipient =
        receiverAccount && receiverAccount !== ""
          ? receiverAccount
          : crossChainTransfer?.receiverAccount;

      const isSending = senderAccount === address;
      const type = isSending ? "OUT" : "IN";

      k_op.id = encodeOperationId(accountId, requestKey, type);
      k_op.hash = requestKey;
      k_op.type = type;
      k_op.value = baseUnitToKda(value);
      k_op.fee = baseUnitToKda(fee);
      k_op.blockHeight = blockHeight;
      k_op.blockHash = blockHash;
      k_op.accountId = accountId;
      k_op.senders = [sender ?? ""];
      k_op.recipients = [recipient ?? ""];
      k_op.hasFailed = Boolean(result?.badResult && result.badResult !== null);
      k_op.date = date;
      k_op.extra = {
        senderChainId: chainId,
        receiverChainId: crossChainTransfer?.chainId ?? chainId,
      };

      ops.push(k_op);
    }
  }

  return ops;
};
