import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { fetchTxs, fetchERC20Transactions } from "../../network/api";
import { convertAddressFilToEth } from "../../network/addresses";
import { TxStatus, type TransactionResponse, type ERC20Transfer } from "../../types";

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

// Maps native FIL transactions into operations. A single tx can yield both an
// OUT (or FEES) and an IN operation when sender === recipient.
function mapNativeOperations(
  address: string,
  txs: TransactionResponse[],
  startIndex: number,
): Operation[] {
  const items: Operation[] = [];
  let opIndex = startIndex;

  for (const tx of txs) {
    const { to, from, hash, timestamp, amount, fee_data, status } = tx;
    const date = new Date(timestamp * 1000);
    const value = BigInt(amount);
    const fee = BigInt(fee_data?.TotalCost ?? "0");
    const failed = status !== TxStatus.Ok;
    const block = { height: tx.height, hash: "", time: date };

    if (address === from) {
      const opType = value === 0n ? "FEES" : "OUT";
      items.push({
        id: `${address}-${hash}-${opType}-${opIndex}`,
        type: opType,
        senders: [from],
        recipients: [to],
        // OUT: value = amount + fees (bridge convention)
        value: value + fee,
        asset: { type: "native" },
        tx: { hash, block, fees: fee, date, failed },
      });
      opIndex++;
    }

    if (address === to) {
      const opType = value === 0n ? "FEES" : "IN";
      items.push({
        id: `${address}-${hash}-${opType}-${opIndex}`,
        type: opType,
        senders: [from],
        recipients: [to],
        value,
        asset: { type: "native" },
        tx: { hash, block, fees: fee, date, failed },
      });
      opIndex++;
    }
  }

  return items;
}

// Maps ERC-20 transactions into operations. ERC-20 records use ETH-format (0x)
// addresses, so we compare against ethAddr (the address used to query the endpoint).
function mapTokenOperations(
  address: string,
  ethAddr: string,
  txs: ERC20Transfer[],
  startIndex: number,
): Operation[] {
  const items: Operation[] = [];
  let opIndex = startIndex;
  const ethAddrLower = ethAddr.toLowerCase();

  for (const tx of txs) {
    const { to, from, tx_hash, tx_cid, amount, height, timestamp, status, contract_address } = tx;
    const hash = tx_cid ?? tx_hash;
    const date = new Date(timestamp * 1000);
    const value = BigInt(amount);
    const failed = status !== TxStatus.Ok;
    const asset = { type: "erc20" as const, assetReference: contract_address.toLowerCase() };
    const block = { height, hash: "", time: date };

    if (ethAddrLower === from.toLowerCase()) {
      items.push({
        id: `${address}-${hash}-OUT-${opIndex}`,
        type: "OUT",
        senders: [from],
        recipients: [to],
        value,
        asset,
        tx: { hash, block, fees: 0n, date, failed },
      });
      opIndex++;
    }

    if (ethAddrLower === to.toLowerCase()) {
      items.push({
        id: `${address}-${hash}-IN-${opIndex}`,
        type: "IN",
        senders: [from],
        recipients: [to],
        value,
        asset,
        tx: { hash, block, fees: 0n, date, failed },
      });
      opIndex++;
    }
  }

  return items;
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

  // Fetch ERC-20 transactions — convert FIL address to Ethereum-compatible address first.
  // address may not be convertible (e.g. f1/f3 secp256k1 without delegated counterpart).
  let ethAddr: string | null = null;
  try {
    ethAddr = convertAddressFilToEth(address);
  } catch {
    ethAddr = null;
  }

  const tokenTxs = ethAddr
    ? ((await fetchERC20Transactions(ethAddr, cur.fromHeight, cur.tokenOffset, limit)).txs ?? [])
    : [];

  // tokenOpIndex continues from the native op count to avoid ID collisions
  const nativeItems = mapNativeOperations(address, nativeTxs, 0);
  const tokenItems = ethAddr
    ? mapTokenOperations(address, ethAddr, tokenTxs, nativeItems.length)
    : [];

  // Merge and sort descending by date
  const items = [...nativeItems, ...tokenItems];
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
