import BigNumber from "bignumber.js";
import { NFTStandard } from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { NftProperties } from "../types";

export const getNftTransactionProperties = (transaction: EvmTransaction): NftProperties => ({
  tokenId: transaction.nft?.tokenId || null,
  contract: transaction.nft?.contract || null,
  quantity: transaction.nft?.quantity || null,
});

export const injectNftIntoTransaction = (
  transaction: EvmTransaction,
  nftProperties: Partial<NftProperties>,
  standard?: NFTStandard,
): EvmTransaction => {
  if (!standard) {
    if (transaction.mode === "send") {
      throw new Error("Expected an NFT transaction but received a Send mode transactions");
    }

    return {
      ...transaction,
      mode: transaction.mode,
      nft: {
        collectionName: transaction.nft?.collectionName ?? "",
        contract: nftProperties?.contract ?? transaction.nft?.contract ?? "",
        tokenId: nftProperties?.tokenId ?? transaction.nft?.tokenId ?? "",
        quantity: nftProperties?.quantity ?? transaction.nft?.quantity ?? new BigNumber(NaN),
      },
    };
  }

  if (standard === "SPL") {
    throw new Error("Expected an ERC721 or ERC1155 standard but received an SPL standard");
  }

  return {
    ...transaction,
    mode: <Lowercase<typeof standard>>standard.toLowerCase(),
    nft: {
      collectionName: transaction.nft?.collectionName ?? "",
      contract: nftProperties?.contract ?? transaction.nft?.contract ?? "",
      tokenId: nftProperties?.tokenId ?? transaction.nft?.tokenId ?? "",
      quantity: nftProperties?.quantity ?? transaction.nft?.quantity ?? new BigNumber(NaN),
    },
  };
};
