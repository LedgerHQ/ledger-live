import { Address } from "@ton/ton";
import BigNumber from "bignumber.js";
import { TonOperation } from "../../types";
import { TonTransaction } from "./api.types";
import { fetchTransactions } from "./api";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

export async function getTransactions(addr: string, startLt?: string): Promise<TonTransaction[]> {
  const txs = await fetchTransactions(addr, { startLt });
  if (txs.length === 0) return [];
  let tmpTxs: TonTransaction[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { lt, hash } = txs[txs.length - 1];
    tmpTxs = await fetchTransactions(addr, { startLt, endLt: lt });
    // we found the last transaction
    if (tmpTxs.length === 1) break;
    // it should always match
    if (hash !== tmpTxs[0].hash) throw Error("[ton] transaction hash does not match");
    tmpTxs.shift(); // first element is repeated
    txs.push(...tmpTxs);
  }
  return txs;
}

export function mapTxToOps(
  accountId: string,
  addr: string,
): (tx: TonTransaction) => TonOperation[] {
  return (tx: TonTransaction): TonOperation[] => {
    const ops: TonOperation[] = [];

    if (tx.out_msgs.length > 1) throw Error(`[ton] txn with > 1 output not expected ${tx}`);

    const accountAddr = Address.parseFriendly(tx.account_friendly).address.toString({
      urlSafe: true,
      bounceable: false,
    });

    if (accountAddr !== addr) throw Error(`[ton] unexpected address ${accountAddr} ${addr}`);

    const isReceiving =
      tx.in_msg &&
      tx.in_msg.source &&
      tx.in_msg.source !== "" &&
      tx.in_msg.value &&
      tx.in_msg.value !== "0" &&
      tx.account_friendly === tx.in_msg.destination_friendly;

    const isSending =
      tx.out_msgs.length !== 0 &&
      tx.out_msgs[0].source &&
      tx.out_msgs[0].source !== "" &&
      tx.out_msgs[0].value &&
      tx.out_msgs[0].value !== "0" &&
      tx.account_friendly === tx.out_msgs[0].source_friendly;

    const date = new Date(tx.now * 1000); // now is defined in seconds
    const hash = tx.in_msg?.hash ?? tx.hash; // this is the hash we know in signature time

    if (isReceiving) {
      if (tx.total_fees !== "0") {
        ops.push({
          id: encodeOperationId(accountId, hash, "FEES"),
          hash,
          type: "FEES",
          value: BigNumber(tx.total_fees),
          fee: BigNumber(0),
          blockHeight: 1, // we don't have block info in tx
          blockHash: null,
          hasFailed: false,
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
        });
      }
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value: BigNumber(tx.in_msg?.value ?? 0),
        fee: BigNumber(0),
        blockHeight: 1, // we don't have block info in tx
        blockHash: null,
        hasFailed: false,
        accountId,
        senders: [tx.in_msg?.source_friendly ?? ""],
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
      });
    }

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash: tx.out_msgs[0].hash,
        type: "OUT",
        value: BigNumber(tx.out_msgs[0].value ?? 0).plus(BigNumber(tx.total_fees)),
        fee: BigNumber(tx.total_fees),
        blockHeight: 1, // we don't have block info in tx
        blockHash: null,
        hasFailed: false,
        accountId,
        senders: [accountAddr],
        recipients: [tx.out_msgs[0].destination_friendly ?? ""],
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
