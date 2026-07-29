import type { TX } from "@ledgerhq/wallet-btc/index";
import type {
  ListOperationsOptions,
  Operation as ApiOperation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { fetchTransparentTxs } from "../../network/explorer";
import { isTransparentZcashAddress } from "../validateAddress";
import { classifyTransparentTx, explorerFee, txDate } from "./transparentTx";

const NATIVE_ASSET = { type: "native", name: "ZEC" } as const;

/**
 * Transparent operation history for a single Zcash address, oldest first.
 *
 * Scope, and why it is what it is: an address is a transparent object. Orchard
 * and Sapling activity is encrypted to a viewing key, and this signature
 * carries none, so no shielded operation is knowable here -- that history comes
 * from the account path, which holds the UFVK and runs the shielded scan (see
 * bridge/sync.ts). A shielded transaction that also moves transparent value is
 * reported for its transparent side, with the fee caveat in `explorerFee`.
 *
 * A unified address is refused rather than answered partially: it would return
 * only its transparent receiver's activity while looking like a complete answer.
 */
export async function listOperations(
  address: string,
  { minHeight, cursor, limit }: ListOperationsOptions,
): Promise<Page<ApiOperation>> {
  if (!isTransparentZcashAddress(address)) {
    throw new Error(
      "listOperations is not supported for shielded or unified addresses: Zcash shielded history requires a viewing key",
    );
  }

  const { txs, next } = await fetchTransparentTxs(address, {
    fromHeight: minHeight,
    token: cursor ?? null,
    batchSize: limit,
  });

  return {
    items: txs.flatMap(tx => toOperations(tx, address)),
    // Always propagated: dropping it would stop a caller after the first page.
    next: next ?? undefined,
  };
}

/**
 * One transaction, from the point of view of one address: at most an OUT (value
 * left the address) and an IN (value arrived).
 *
 * A transaction that both spends from and pays back to the address is a single
 * OUT whose value nets the return -- the returned part is change, not income,
 * and reporting it as an IN as well would double-count it.
 */
function toOperations(tx: TX, address: string): ApiOperation[] {
  const { ownInputs, ownOutputs, spent, returned, senders, recipients } = classifyTransparentTx(
    tx,
    candidate => candidate === address,
  );

  const fees = explorerFee(tx);
  const date = txDate(tx);
  const common = {
    asset: NATIVE_ASSET,
    senders,
    recipients,
    tx: {
      hash: tx.id,
      block: {
        height: tx.block?.height ?? 0,
        hash: tx.block?.hash ?? "",
        time: date,
      },
      fees: BigInt(fees.toFixed(0)),
      date,
      failed: false,
    },
  };

  if (ownInputs.length > 0) {
    // Spent minus what came back = the amount that left, fees included, which
    // is the value an OUT operation reports.
    return [
      {
        ...common,
        id: `${tx.id}-OUT`,
        type: "OUT",
        value: BigInt(spent.minus(returned).toFixed(0)),
      },
    ];
  }

  if (ownOutputs.length > 0) {
    return [{ ...common, id: `${tx.id}-IN`, type: "IN", value: BigInt(returned.toFixed(0)) }];
  }

  return [];
}
