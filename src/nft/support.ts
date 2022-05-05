import { Transaction, CryptoCurrency, ProtoNFT } from "../types";
import { getEnv } from "../env";

export const isNftTransaction = (transaction: Transaction): boolean => {
  if (transaction.family === "ethereum") {
    return ["erc721.transfer", "erc1155.transfer"].includes(transaction.mode);
  }

  return false;
};

export function isNFTActive(currency: CryptoCurrency): boolean {
  return getEnv("NFT_CURRENCIES").split(",").includes(currency.id);
}

const nftCapabilities = {
  hasQuantity: ["ERC1155"],
};

export const getNftCapabilities = (nft: ProtoNFT) =>
  Object.entries(nftCapabilities).reduce(
    (acc, [capability, standards]) => ({
      ...acc,
      [capability]: standards.includes(nft.standard),
    }),
    {}
  );
