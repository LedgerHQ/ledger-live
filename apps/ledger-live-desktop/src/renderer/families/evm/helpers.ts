import BigNumber from "bignumber.js";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/lib/types";
import { NftProperties } from "../types";
import { NFTStandard } from "@ledgerhq/types-live";

export const getNftTransactionProperties = (transaction: EvmTransaction): NftProperties => ({
  tokenId: transaction.nft?.tokenId || null,
  contract: transaction.nft?.contract || null,
  quantity: transaction.nft?.quantity || null,
});

export const injectNftIntoTransaction = (
  transaction: EvmTransaction,
  nftProperties: Partial<NftProperties>,
  standard?: NFTStandard,
): EvmTransaction => ({
  ...transaction,
  mode: (standard ? standard.toLowerCase() : transaction.mode) as Lowercase<NFTStandard>,
  nft: {
    collectionName: transaction.nft?.collectionName ?? "",
    contract: nftProperties?.contract ?? transaction.nft?.contract ?? "",
    tokenId: nftProperties?.tokenId ?? transaction.nft?.tokenId ?? "",
    quantity: nftProperties?.quantity ?? transaction.nft?.quantity ?? new BigNumber(NaN),
  },
});
