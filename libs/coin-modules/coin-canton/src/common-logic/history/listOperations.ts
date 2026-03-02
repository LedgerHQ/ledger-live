import type { AssetInfo, Cursor, Operation, Page } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getOperations } from "../../network/gateway";
import type { AssetView } from "../../types/gateway";

function convertAssetViewToAssetInfo(asset?: AssetView): AssetInfo {
  if (!asset || asset.type === "native") {
    return { type: "native" };
  }

  if (asset.type === "token") {
    return {
      type: asset.type,
      ...(asset.instrumentId ? { assetReference: asset.instrumentId } : {}),
      ...(asset.instrumentAdmin ? { assetOwner: asset.instrumentAdmin } : {}),
    };
  }

  return { type: asset.type };
}

/**
 * Returns list of operations associated to an account.
 * @param partyId Account partyId
 * @param minHeight Minimum block height
 * @param cursor Pagination cursor
 * @param limit Max number of operations
 * @returns Operations found and the next cursor for pagination.
 */
export async function listOperations(
  currency: CryptoCurrency,
  partyId: string,
  minHeight: number,
  cursor?: Cursor,
  limit?: number,
  _order?: "asc" | "desc",
): Promise<Page<Operation>> {
  const { operations, next } = await getOperations(currency, partyId, {
    cursor: cursor !== undefined ? parseInt(cursor) : undefined,
    minOffset: minHeight,
    limit: limit,
  });
  const ops: Operation[] = [];
  for (const tx of operations) {
    if (tx.type === "Send" && tx.senders && tx.recipients && tx.transfers?.length) {
      const asset = convertAssetViewToAssetInfo(tx.asset);

      ops.push({
        id: tx.uid,
        type: tx.senders.includes(partyId) ? "OUT" : "IN",
        value: BigInt(tx.transfers[0].value),
        senders: tx.senders,
        recipients: tx.recipients,
        asset,
        tx: {
          hash: tx.block.hash ?? "",
          fees: BigInt(tx.fee.value),
          date: new Date(tx.transaction_timestamp),
          block: {
            height: tx.block.height,
            hash: tx.block.hash ?? "",
            time: new Date(tx.block.time),
          },
          failed: false,
        },
      });
    }
  }
  return { items: ops, next: next !== undefined ? next + "" : undefined };
}
