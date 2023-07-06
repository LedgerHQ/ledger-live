import BigNumber from "bignumber.js";
import { NFTStandard } from "@ledgerhq/types-live";
import {
  Transaction as EthereumTransaction,
  TransactionMode,
} from "@ledgerhq/live-common/families/ethereum/types";
import { NftProperties } from "../types";

export const getNftTransactionProperties = (transaction: EthereumTransaction): NftProperties => ({
  tokenId: transaction?.tokenIds?.[0] || null,
  contract: transaction?.collection || null,
  quantity: transaction?.quantities?.[0] || null,
});

export const injectNftIntoTransaction = (
  transaction: EthereumTransaction,
  nftProperties: Partial<NftProperties>,
  standard?: NFTStandard,
): EthereumTransaction => ({
  ...transaction,
  mode: standard ? (`${standard.toLowerCase()}.transfer` as TransactionMode) : transaction.mode,
  collection: nftProperties?.contract ?? transaction?.collection ?? "",
  tokenIds: [nftProperties?.tokenId ?? transaction.tokenIds?.[0] ?? ""],
  quantities: [nftProperties?.quantity ?? transaction.quantities?.[0] ?? new BigNumber(NaN)],
});
