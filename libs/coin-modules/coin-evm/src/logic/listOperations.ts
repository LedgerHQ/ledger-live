import { MemoNotSupported, Operation, Pagination } from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation } from "@ledgerhq/types-live";
import { EvmAsset } from "../types";
import { getExplorerApi } from "../network/explorer";

const toOperation = (
  assetType: "native" | "token",
  op: LiveOperation,
): Operation<EvmAsset, MemoNotSupported> => ({
  id: op.id,
  type: op.type,
  senders: op.senders,
  recipients: op.recipients,
  value: BigInt(op.value.toFixed(0)),
  asset:
    assetType === "native"
      ? { type: assetType }
      : { type: assetType, standard: "erc", contractAddress: op.contract ?? "" },
  tx: {
    hash: op.hash,
    block: {
      height: op.blockHeight ?? 0,
      hash: op.blockHash ?? "",
    },
    fees: BigInt(op.fee.toFixed(0)),
    date: op.date,
  },
});

export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  pagination: Pagination,
): Promise<[Operation<EvmAsset, MemoNotSupported>[], string]> {
  const explorerApi = getExplorerApi(currency);
  const { lastCoinOperations, lastTokenOperations } = await explorerApi.getLastOperations(
    currency,
    address,
    `js:2:${currency.id}:${address}:`,
    pagination.minHeight,
  );
  const nativeOperations = lastCoinOperations.map<Operation<EvmAsset, MemoNotSupported>>(op =>
    toOperation("native", op),
  );
  const tokenOperations = lastTokenOperations.map<Operation<EvmAsset, MemoNotSupported>>(op =>
    toOperation("token", op),
  );

  return [
    nativeOperations.concat(tokenOperations).filter(op => ["FEES", "IN", "OUT"].includes(op.type)),
    "",
  ];
}
