import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { fetchTxs, fetchERC20Transactions } from "../api/api";
import { convertAddressFilToEth } from "../network/addresses";
import { TxStatus } from "../types";

// Cursor encodes pagination state for both native and ERC-20 streams separately.
// Format: JSON { nativeOffset: number, tokenOffset: number, fromHeight: number }
type FilecoinCursor = {
  nativeOffset: number;
  tokenOffset: number;
  fromHeight: number;
};

const PAGE_LIMIT = 50;

function parseCursor(cursor: string | undefined, minHeight: number): FilecoinCursor {
  if (!cursor) {
    return { nativeOffset: 0, tokenOffset: 0, fromHeight: minHeight };
  }
  try {
    return JSON.parse(cursor) as FilecoinCursor;
  } catch {
    return { nativeOffset: 0, tokenOffset: 0, fromHeight: minHeight };
  }
}

export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const limit = options.limit ?? PAGE_LIMIT;
  const cur = parseCursor(options.cursor, options.minHeight ?? 0);

  // Fetch native FIL transactions
  const nativeResp = await fetchTxs(address, cur.fromHeight, cur.nativeOffset, limit);
  const nativeTxs = nativeResp.txs ?? [];

  // Fetch ERC-20 transactions — convert FIL address to Ethereum-compatible address first
  let ethAddr: string | null = null;
  try {
    ethAddr = convertAddressFilToEth(address);
  } catch {
    // address not convertible to eth (e.g. f1/f3 secp256k1 without delegated counterpart)
    ethAddr = null;
  }

  const tokenTxs = ethAddr
    ? (await fetchERC20Transactions(ethAddr, cur.fromHeight, cur.tokenOffset, limit)).txs
    : [];

  const items: Operation[] = [];

  // Map native transactions
  let nativeOpIndex = 0;
  for (const tx of nativeTxs) {
    const { to, from, hash, timestamp, amount, fee_data, status } = tx;
    const date = new Date(timestamp * 1000);
    const value = BigInt(amount);
    const fee = BigInt(fee_data?.TotalCost ?? "0");
    const failed = status !== TxStatus.Ok;

    const isSending = address === from;
    const isReceiving = address === to;

    if (isSending) {
      const opType = value === 0n ? "FEES" : "OUT";
      items.push({
        id: `${address}-${hash}-${opType}-${nativeOpIndex}`,
        type: opType,
        senders: [from],
        recipients: [to],
        // OUT: value = amount + fees (bridge convention)
        value: value + fee,
        asset: { type: "native" },
        tx: {
          hash,
          block: { height: tx.height, hash: "", time: date },
          fees: fee,
          date,
          failed,
        },
      });
      nativeOpIndex++;
    }

    if (isReceiving) {
      const opType = value === 0n ? "FEES" : "IN";
      items.push({
        id: `${address}-${hash}-${opType}-${nativeOpIndex}`,
        type: opType,
        senders: [from],
        recipients: [to],
        value,
        asset: { type: "native" },
        tx: {
          hash,
          block: { height: tx.height, hash: "", time: date },
          fees: fee,
          date,
          failed,
        },
      });
      nativeOpIndex++;
    }
  }

  // Map ERC-20 transactions
  // operationIndex starts at nativeOpIndex + 1 to avoid collisions within the same call
  let tokenOpIndex = nativeOpIndex;
  for (const tx of tokenTxs) {
    const { to, from, tx_hash, tx_cid, amount, height, timestamp, status, contract_address } = tx;
    const hash = tx_cid ?? tx_hash;
    const date = new Date(timestamp * 1000);
    const value = BigInt(amount);
    const failed = status !== TxStatus.Ok;
    const contractAddr = contract_address.toLowerCase();

    // ERC-20 transactions use ETH-format addresses (0x...) while the input
    // address may be in Filecoin f4 format. Compare against ethAddr which was
    // used to query the ERC-20 endpoint.
    const ethAddrLower = ethAddr!.toLowerCase();
    const isSending = ethAddrLower === from.toLowerCase();
    const isReceiving = ethAddrLower === to.toLowerCase();

    if (isSending) {
      items.push({
        id: `${address}-${hash}-OUT-${tokenOpIndex}`,
        type: "OUT",
        senders: [from],
        recipients: [to],
        value,
        asset: { type: "erc20", assetReference: contractAddr },
        tx: {
          hash,
          block: { height, hash: "", time: date },
          fees: 0n,
          date,
          failed,
        },
      });
      tokenOpIndex++;
    }

    if (isReceiving) {
      items.push({
        id: `${address}-${hash}-IN-${tokenOpIndex}`,
        type: "IN",
        senders: [from],
        recipients: [to],
        value,
        asset: { type: "erc20", assetReference: contractAddr },
        tx: {
          hash,
          block: { height, hash: "", time: date },
          fees: 0n,
          date,
          failed,
        },
      });
      tokenOpIndex++;
    }
  }

  // Sort merged operations descending by date
  items.sort((a, b) => b.tx.date.getTime() - a.tx.date.getTime());

  const hasMoreNative = nativeTxs.length >= limit;
  const hasMoreToken = tokenTxs.length >= limit;

  // OR rule: if either stream has more pages, propagate a next cursor
  let next: string | undefined;
  if (hasMoreNative || hasMoreToken) {
    const nextCursor: FilecoinCursor = {
      nativeOffset: cur.nativeOffset + (hasMoreNative ? limit : nativeTxs.length),
      tokenOffset: cur.tokenOffset + (hasMoreToken ? limit : tokenTxs.length),
      fromHeight: cur.fromHeight,
    };
    next = JSON.stringify(nextCursor);
  }

  return { items, next };
}
