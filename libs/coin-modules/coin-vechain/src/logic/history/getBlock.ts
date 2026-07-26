import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { getBlock as getBlockFromNetwork } from "../../network";
import type { ApiResponseBlockTransaction } from "../../types";
import { toBlockInfo } from "./getBlockInfo";

// Full expanded block; block info is derived from it (no separate fetch). Only native VET transfers
// map to operations; VTHO (VIP-180) movements are ABI-encoded events, not decoded here.
export async function getBlock(height: number): Promise<Block> {
  const block = await getBlockFromNetwork(height, true);

  if (!block) {
    throw new Error(`vechain: no block at height ${height}`);
  }

  const transactions = block.transactions as ApiResponseBlockTransaction[];

  return {
    info: toBlockInfo(block),
    transactions: transactions.map(toBlockTransaction),
  };
}

function toBlockTransaction(tx: ApiResponseBlockTransaction): BlockTransaction {
  const operations: BlockOperation[] = tx.outputs.flatMap(output =>
    output.transfers.map(
      (transfer): BlockOperation => ({
        type: "transfer",
        address: transfer.recipient,
        peer: transfer.sender,
        asset: { type: "native" },
        amount: BigInt(transfer.amount || "0"),
      }),
    ),
  );

  return {
    hash: tx.id,
    failed: tx.reverted,
    operations,
    fees: BigInt(tx.paid || "0"),
    feesPayer: tx.gasPayer ?? tx.origin,
  };
}
