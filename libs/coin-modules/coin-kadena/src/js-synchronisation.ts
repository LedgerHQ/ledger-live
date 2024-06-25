import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { fetchNetworkInfo, fetchCoinDetailsForAccount, fetchTransactions } from "./api/network";
import { GetTxnsResponse } from "./api/types";
import { KadenaOperation } from "./types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import { baseUnitToKda } from "./utils";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { decodeAccountId } from "@ledgerhq/coin-framework/account/index";

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

  const networkInfo = await fetchNetworkInfo();
  const balanceResp = await fetchCoinDetailsForAccount(address, networkInfo.nodeChains);
  const rawTxs = await fetchTransactions(address);
  // const mempoolTxs = await fetchFullMempoolTxs(address);

  let totalBalance = new BigNumber(0);
  for (const balance of Object.values(balanceResp)) {
    totalBalance = totalBalance.plus(balance);
  }

  const balance = baseUnitToKda(totalBalance);
  // for (const tx of mempoolTxs) {
  //   spendableBalance = spendableBalance
  //     .minus(new BigNumber(tx.fee_rate))
  //     .minus(new BigNumber(tx.token_transfer.amount));
  // }

  const result: Partial<Account> = {
    id: accountId,
    xpub: pubKey,
    freshAddress: address,
    balance,
    spendableBalance: balance,
    operations: rawTxsToOps(rawTxs, accountId, address),
    blockHeight: networkInfo.nodeLatestBehaviorHeight,
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

const rawTxsToOps = (rawTxs: GetTxnsResponse[], accountId: string, address: string): KadenaOperation[] => {
  const ops: KadenaOperation[] = [];
  let txs = new Map();

  // Gather ops from the same transaction
  for (let rawTx of rawTxs) {
    let tmp = [];

    if (rawTx.token !== "coin") continue;

    if (txs.has(rawTx.requestKey)) { tmp = txs.get(rawTx.requestKey); }
    tmp.push(rawTx);

    txs.set(rawTx.requestKey, tmp);
  }

  // Build ops by taking index 0 as fee and index 1 as the actual transaction
  for (let tx of txs.values()) {
    let k_op: KadenaOperation = {} as KadenaOperation;
    k_op.fee = new BigNumber(0);
    k_op.value = new BigNumber(0);

    let transaction_op = null;
    let fee_op = null;

    // Find minimal amount value and 
    for (let op of tx) {
      if (!transaction_op || (transaction_op && new BigNumber(transaction_op.amount) < new BigNumber(op.amount))) {
        transaction_op = op;
        fee_op = fee_op ? fee_op : transaction_op;
      } else {
        fee_op = op;
      }
    }

    const { requestKey, blockTime, height, amount, fromAccount, toAccount, blockHash, chain, crossChainAccount, crossChainId } = transaction_op;
    const blockHeight = height;
    const date = new Date(blockTime);
    const value = new BigNumber(amount);
    const fee = new BigNumber(fee_op.amount);

    const isSending = fromAccount === address;
    const type = isSending ? "OUT" : "IN";

    k_op.id = encodeOperationId(accountId, requestKey, type);
    k_op.hash = requestKey;
    k_op.type = type;
    k_op.value = baseUnitToKda(value);
    k_op.fee = baseUnitToKda(fee);
    k_op.blockHeight = blockHeight;
    k_op.blockHash = blockHash;
    k_op.accountId = accountId;
    k_op.senders = [fromAccount || crossChainAccount];
    k_op.recipients = [toAccount || crossChainAccount];
    k_op.date = date;
    k_op.extra = {
      senderChainId: chain,
      receiverChainId: crossChainId ?? chain,
    };
  
    ops.push(k_op);
  }

  return ops;
}