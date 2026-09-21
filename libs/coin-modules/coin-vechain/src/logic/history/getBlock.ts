import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { decodeVip180Transfer, isVip180Transfer } from "../../common-logic/vip180";
import type { VechainContext } from "../../config";
import { getBlock as getBlockFromNetwork } from "../../network";
import type { ApiResponseBlockOutput, ApiResponseBlockTransaction } from "../../types";
import { NATIVE_ASSET } from "../account/getBalance";
import { toBlockInfo } from "./getBlockInfo";

// `assetOwner` is deliberately omitted: it identifies the account holding the token sub-account and
// is only meaningful when listing operations for one address, which a block is not scoped to.
const VTHO_ASSET: AssetInfo = { type: "token", assetReference: VTHO_ADDRESS, name: "VTHO" };

// Full expanded block; block info is derived from it (no separate fetch). Both native VET transfers
// (`output.transfers`) and VTHO (VIP-180) movements (`output.events`) map to operations.
export async function getBlock(context: VechainContext, height: number): Promise<Block> {
  const config = await context.config();
  const block = await getBlockFromNetwork(config, height, true);

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
  const operations = tx.outputs.flatMap(toBlockOperations);

  return {
    hash: tx.id,
    failed: tx.reverted,
    operations,
    fees: BigInt(tx.paid || "0"),
    feesPayer: tx.gasPayer ?? tx.origin,
  };
}

function toBlockOperations(output: ApiResponseBlockOutput): BlockOperation[] {
  const vet = output.transfers.flatMap(transfer =>
    signedPair(transfer.sender, transfer.recipient, BigInt(transfer.amount || "0"), NATIVE_ASSET),
  );

  const vtho = output.events.flatMap(event => {
    if (!isVip180Transfer(event, VTHO_ADDRESS)) return [];
    const { from, to, value } = decodeVip180Transfer(event);
    return signedPair(from, to, value, VTHO_ASSET);
  });

  return [...vet, ...vtho];
}

/**
 * One operation per side of a transfer: `amount` is the signed impact on `address`, so a transfer
 * is reported twice — negative for the sender, positive for the recipient.
 *
 * `asset` is copied into each operation rather than shared: callers pass a module-level constant
 * (`NATIVE_ASSET`, `VTHO_ASSET`), so handing out the same reference would let a consumer that
 * completes an asset in place — setting `assetOwner`, as `vthoAsset(address)` does elsewhere in
 * this module — mutate every other operation of every other block in the process.
 */
function signedPair(
  sender: string,
  recipient: string,
  amount: bigint,
  asset: AssetInfo,
): BlockOperation[] {
  return [
    { type: "transfer", address: sender, peer: recipient, asset: { ...asset }, amount: -amount },
    { type: "transfer", address: recipient, peer: sender, asset: { ...asset }, amount },
  ];
}
