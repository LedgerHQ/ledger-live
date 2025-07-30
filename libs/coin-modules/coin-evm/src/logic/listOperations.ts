import {
  AssetInfo,
  MemoNotSupported,
  Operation,
  Pagination,
} from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation } from "@ledgerhq/types-live";
import { getExplorerApi } from "../network/explorer";

const toOperation = (
  assetType: "native" | "token",
  op: LiveOperation,
): Operation<MemoNotSupported> => {
  const assetInfo: AssetInfo = { type: assetType };

  if (assetType !== "native") {
    assetInfo.assetReference = op.contract ?? "";
    if (op.standard) {
      if (op.standard === "ERC721") {
        assetInfo.type = "erc721";
      } else if (op.standard === "ERC1155") {
        assetInfo.type = "erc1155";
      } else {
        assetInfo.type = "token"; // NOTE: old default
      }
    } else {
      assetInfo.type = "erc20";
    }
  }

  return {
    id: op.id,
    type: op.type,
    senders: op.senders,
    recipients: op.recipients,
    value: BigInt(op.value.toFixed(0)),
    asset: assetInfo,
    tx: {
      hash: op.hash,
      block: {
        height: op.blockHeight ?? 0,
        hash: op.blockHash ?? "",
      },
      fees: BigInt(op.fee.toFixed(0)),
      date: op.date,
    },
  };
};

export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  pagination: Pagination,
): Promise<[Operation<MemoNotSupported>[], string]> {
  const explorerApi = getExplorerApi(currency);
  const { lastCoinOperations, lastTokenOperations } = await explorerApi.getLastOperations(
    currency,
    address,
    `js:2:${currency.id}:${address}:`,
    pagination.minHeight,
  );
  const nativeOperations = lastCoinOperations.map<Operation<MemoNotSupported>>(op =>
    toOperation("native", op),
  );
  const tokenOperations = lastTokenOperations.map<Operation<MemoNotSupported>>(op =>
    toOperation("token", op),
  );

  return [
    nativeOperations.concat(tokenOperations).filter(op => ["FEES", "IN", "OUT"].includes(op.type)),
    "",
  ];
}
