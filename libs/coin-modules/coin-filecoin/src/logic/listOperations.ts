import type {
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { fetchTxsWithPages } from "../api/api";
import { TxStatus, type TransactionResponse } from "../types";

function mapTxToOperations(
  address: string,
  tx: TransactionResponse,
): Operation<MemoNotSupported>[] {
  const { to, from, hash, timestamp, amount, fee_data, height, status } = tx;

  const blockInfo = {
    height,
    hash: "",
    time: new Date(timestamp * 1000),
  };

  const fees = BigInt(fee_data?.TotalCost ?? 0);
  const failed = status !== TxStatus.Ok;
  const value = BigInt(amount);
  const date = new Date(timestamp * 1000);

  const ops: Operation<MemoNotSupported>[] = [];

  if (address === from) {
    const type = value === 0n ? "FEES" : "OUT";
    ops.push({
      id: `${hash}-${type}`,
      type,
      senders: [from],
      recipients: [to],
      value: type === "OUT" ? value + fees : fees,
      asset: { type: "native" },
      tx: { hash, block: blockInfo, fees, date, failed },
    });
  }

  if (address === to && address !== from) {
    const type = value === 0n ? "FEES" : "IN";
    ops.push({
      id: `${hash}-${type}`,
      type,
      senders: [from],
      recipients: [to],
      value,
      asset: { type: "native" },
      tx: { hash, block: blockInfo, fees, date, failed },
    });
  }

  return ops;
}

export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const lastHeight = options.minHeight ?? 0;
  const txs = await fetchTxsWithPages(address, lastHeight);

  const items = txs.flatMap(tx => mapTxToOperations(address, tx));

  return { items };
}
