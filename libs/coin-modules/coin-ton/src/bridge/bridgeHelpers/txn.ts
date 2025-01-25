import { decodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { Operation } from "@ledgerhq/types-live";
import { Address, Cell } from "@ton/core";
import BigNumber from "bignumber.js";
import { TonOperation } from "../../types";
import { addressesAreEqual, isAddressValid } from "../../utils";
import { fetchJettonTransactions, fetchTransactions } from "./api";
import {
  TonAddressBook,
  TonJettonTransfer,
  TonTransaction,
  TonTransactionsList,
} from "./api.types";

export async function getTransactions(
  addr: string,
  startLt?: string,
): Promise<TonTransactionsList> {
  const txs = await fetchTransactions(addr, { startLt });
  if (txs.transactions.length === 0) return txs;
  let tmpTxs: TonTransactionsList;
  let isUncompletedResult = true;

  while (isUncompletedResult) {
    const { lt, hash } = txs.transactions[txs.transactions.length - 1];
    tmpTxs = await fetchTransactions(addr, { startLt, endLt: lt });
    // we found the last transaction
    if (tmpTxs.transactions.length === 1) {
      isUncompletedResult = false;
      break;
    }
    // it should always match
    if (hash !== tmpTxs.transactions[0].hash) throw Error("[ton] transaction hash does not match");
    tmpTxs.transactions.shift(); // first element is repeated
    txs.transactions.push(...tmpTxs.transactions);
    txs.address_book = { ...txs.address_book, ...tmpTxs.address_book };
  }
  return txs;
}

export async function getJettonTransfers(
  addr: string,
  startLt?: string,
): Promise<TonJettonTransfer[]> {
  const txs = await fetchJettonTransactions(addr, { startLt });
  if (txs.length === 0) return txs;
  let tmpTxs: TonJettonTransfer[];
  let isUncompletedResult = true;

  while (isUncompletedResult) {
    const { transaction_hash, transaction_lt } = txs[txs.length - 1];
    tmpTxs = await fetchJettonTransactions(addr, { startLt, endLt: transaction_lt });
    // we found the last transaction
    if (tmpTxs.length === 1) {
      isUncompletedResult = false;
      break;
    }
    // it should always match
    if (transaction_hash !== tmpTxs[0].transaction_hash)
      throw Error("[ton] transaction hash does not match");
    tmpTxs.shift(); // first element is repeated
    txs.push(...tmpTxs);
  }
  return txs;
}

function getFriendlyAddress(addressBook: TonAddressBook, rawAddr?: string | null): string[] {
  if (!rawAddr) return [];
  if (addressBook[rawAddr]) return [addressBook[rawAddr].user_friendly];
  if (!isAddressValid(rawAddr)) throw new Error("[ton] address is not valid");
  return [Address.parse(rawAddr).toString({ urlSafe: true, bounceable: true })];
}

export function mapTxToOps(
  accountId: string,
  addr: string,
  addressBook: TonAddressBook,
): (tx: TonTransaction) => TonOperation[] {
  return (tx: TonTransaction): TonOperation[] => {
    const ops: TonOperation[] = [];

    if (tx.out_msgs.length > 1) throw Error(`[ton] txn with > 1 output not expected ${tx}`);

    const accountAddr = Address.parse(tx.account).toString({ urlSafe: true, bounceable: false });

    if (accountAddr !== addr) throw Error(`[ton] unexpected address ${accountAddr} ${addr}`);

    const isReceiving =
      tx.in_msg &&
      tx.in_msg.source &&
      tx.in_msg.source !== "" &&
      tx.in_msg.value &&
      tx.in_msg.value !== "0" &&
      tx.account === tx.in_msg.destination;

    const isSending =
      tx.out_msgs.length !== 0 &&
      tx.out_msgs[0].source &&
      tx.out_msgs[0].source !== "" &&
      tx.out_msgs[0].value &&
      tx.out_msgs[0].value !== "0" &&
      tx.account === tx.out_msgs[0].source;

    const date = new Date(tx.now * 1000); // now is defined in seconds
    const hash = tx.in_msg?.hash ?? tx.hash; // this is the hash we know in signature time
    const hasFailed =
      tx.description.compute_ph.success === false && tx.description.compute_ph.exit_code !== 0;

    if (isReceiving) {
      let subOperations: Operation[] | undefined;
      if (tx.total_fees !== "0") {
        // these are small amount of fees payed when receiving
        // we don't want to show them in the charts
        subOperations = [
          {
            id: encodeOperationId(accountId, hash, "NONE"),
            hash,
            type: "NONE",
            value: BigNumber(tx.total_fees),
            fee: BigNumber(0),
            blockHeight: tx.mc_block_seqno ?? 1,
            blockHash: null,
            hasFailed,
            accountId,
            senders: [accountAddr],
            recipients: [],
            date,
            extra: {
              lt: tx.lt,
              explorerHash: tx.hash,
              comment: {
                isEncrypted: false,
                text: "",
              },
            },
          },
        ];
      }
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value: BigNumber(tx.in_msg?.value ?? 0),
        fee: BigNumber(tx.total_fees),
        blockHeight: tx.mc_block_seqno ?? 1,
        blockHash: null,
        hasFailed,
        accountId,
        senders: getFriendlyAddress(addressBook, tx.in_msg?.source),
        recipients: [accountAddr],
        date,
        extra: {
          lt: tx.lt,
          explorerHash: tx.hash,
          comment: {
            isEncrypted: tx.in_msg?.message_content?.decoded?.type === "binary_comment",
            text:
              tx.in_msg?.message_content?.decoded?.type === "text_comment"
                ? tx.in_msg.message_content.decoded.comment
                : "",
          },
        },
        subOperations,
      });
    }

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash: tx.out_msgs[0].hash, // this hash matches with in_msg.hash of IN transaction
        type: "OUT",
        value: BigNumber(tx.out_msgs[0].value ?? 0),
        fee: BigNumber(tx.total_fees),
        blockHeight: tx.mc_block_seqno ?? 1,
        blockHash: null,
        hasFailed,
        accountId,
        senders: [accountAddr],
        recipients: getFriendlyAddress(addressBook, tx.out_msgs[0].destination),
        date,
        extra: {
          lt: tx.lt,
          explorerHash: tx.hash,
          comment: {
            isEncrypted: tx.out_msgs[0].message_content?.decoded?.type === "binary_comment",
            text:
              tx.out_msgs[0].message_content?.decoded?.type === "text_comment"
                ? tx.out_msgs[0].message_content.decoded.comment
                : "",
          },
        },
      });
    }

    return ops;
  };
}

export function mapJettonTxToOps(
  accountId: string,
  addr: string,
  addressBook: TonAddressBook,
): (tx: TonJettonTransfer) => TonOperation[] {
  return (tx: TonJettonTransfer): TonOperation[] => {
    const accountAddr = Address.parse(addr).toString({ urlSafe: true, bounceable: false });
    if (accountAddr !== addr) throw Error(`[ton] unexpected address ${accountAddr} ${addr}`);

    const jettonMasterAddr = Address.parse(tx.jetton_master).toString({
      urlSafe: true,
      bounceable: true,
    });
    const tokenCurrency = findTokenByAddressInCurrency(
      jettonMasterAddr.toLowerCase(),
      decodeAccountId(accountId).currencyId,
    );
    if (!tokenCurrency) return [];
    const tokenAccountId = encodeTokenAccountId(accountId, tokenCurrency);

    const ops: TonOperation[] = [];
    const isReceiving = addressesAreEqual(
      accountAddr,
      Address.parse(tx.destination).toString({ urlSafe: true, bounceable: false }),
    );
    const isSending = addressesAreEqual(
      accountAddr,
      Address.parse(tx.source).toString({ urlSafe: true, bounceable: false }),
    );
    if (!isSending && !isReceiving) throw Error("[ton] unexpected addresses");

    const date = new Date(tx.transaction_now * 1000); // now is defined in seconds
    const hash = tx.transaction_hash;

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(tokenAccountId, hash, "IN"),
        hash,
        type: "IN",
        value: BigNumber(tx.amount),
        fee: BigNumber(0),
        blockHeight: 1, // we don't have block info
        blockHash: null,
        hasFailed: false,
        accountId: tokenAccountId,
        senders: getFriendlyAddress(addressBook, tx.source),
        recipients: [accountAddr],
        date,
        extra: {
          lt: tx.transaction_lt,
          explorerHash: hash,
          comment: {
            isEncrypted: false,
            text: tx.forward_payload ? decodeForwardPayload(tx.forward_payload) : "",
          },
        },
      });
    }

    if (isSending) {
      ops.push({
        id: encodeOperationId(tokenAccountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: BigNumber(tx.amount),
        fee: BigNumber(0),
        blockHeight: 1, // we don't have block info
        blockHash: null,
        hasFailed: false,
        accountId: tokenAccountId,
        senders: [accountAddr],
        recipients: getFriendlyAddress(addressBook, tx.destination),
        date,
        extra: {
          lt: tx.transaction_lt,
          explorerHash: hash,
          comment: {
            isEncrypted: false,
            text: tx.forward_payload ? decodeForwardPayload(tx.forward_payload) : "",
          },
        },
      });
    }

    return ops;
  };
}

function decodeForwardPayload(payload: string | null): string {
  if (!payload) return "";

  const decodedBuffer = Buffer.from(payload, "base64");
  const cell = Cell.fromBoc(decodedBuffer)[0];
  const slice = cell.beginParse();

  // Read the opcode
  const opcode = slice.loadUint(32);
  if (opcode !== 0) {
    return "";
  }

  // Read the comment
  const comment = slice.loadStringTail();
  return comment;
}
