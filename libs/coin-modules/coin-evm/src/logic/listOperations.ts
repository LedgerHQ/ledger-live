import { AssetInfo, MemoNotSupported, Operation } from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation } from "@ledgerhq/types-live";
import { getExplorerApi } from "../network/explorer";

const toOperation = (
  asset: { type: "native" } | { type: "token"; owner: string },
  op: LiveOperation,
): Operation<MemoNotSupported> => {
  const assetInfo: AssetInfo = { type: asset.type };

  if (asset.type === "token") {
    assetInfo.assetReference = op.contract ?? "";
    assetInfo.assetOwner = asset.owner;
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
  minHeight: number,
): Promise<[Operation<MemoNotSupported>[], string]> {
  const explorerApi = getExplorerApi(currency);
  const { lastCoinOperations, lastTokenOperations } = await explorerApi.getLastOperations(
    currency,
    address,
    `js:2:${currency.id}:${address}:`,
    minHeight,
  );
  const nativeOperations = lastCoinOperations.map<Operation<MemoNotSupported>>(op =>
    toOperation({ type: "native" }, op),
  );
  const tokenOperations = lastTokenOperations.map<Operation<MemoNotSupported>>(op =>
    toOperation({ type: "token", owner: address }, op),
  );

  return [
    nativeOperations.concat(tokenOperations).filter(op => ["FEES", "IN", "OUT"].includes(op.type)),
    "",
  ];
}
