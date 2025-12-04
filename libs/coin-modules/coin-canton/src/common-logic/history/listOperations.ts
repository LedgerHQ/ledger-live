import type { AssetInfo, Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getOperations } from "../../network/gateway";
import type { AssetView } from "../../types/gateway";

function convertAssetViewToAssetInfo(asset?: AssetView): AssetInfo {
  if (!asset) {
    return { type: "native" };
  }

  if (asset.type === "native") {
    return { type: "native" };
  }

  if (asset.type === "token") {
    return {
      type: asset.type,
      ...(asset.instrumentId && { assetReference: asset.instrumentId }),
      ...(asset.instrumentAdmin && { assetOwner: asset.instrumentAdmin }),
    };
  }

  return { type: asset.type };
}

/**
 * Returns list of operations associated to an account.
 * @param partyId Account partyId
 * @param pagination Pagination options
 * @returns Operations found and the next "id" or "index" to use for pagination (i.e. `start` property).\
 * Impl to finalize when backend is ready
 */
export async function listOperations(
  currency: CryptoCurrency,
  partyId: string,
  page: Pagination,
): Promise<[Operation[], string]> {
  const { operations, next } = await getOperations(currency, partyId, {
    cursor: page.pagingToken !== undefined ? parseInt(page.pagingToken) : undefined,
    minOffset: page.minHeight,
    limit: page.limit,
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
            time: new Date(tx.block.time),
          },
          failed: false,
        },
      });
    }
  }
  return [ops, next + ""];
}
