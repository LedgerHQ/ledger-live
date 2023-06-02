import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { NFTStandard, ProtoNFT } from "@ledgerhq/types-live";

export function isNFTActive(currency: CryptoCurrency | undefined | null): boolean {
  return getEnv("NFT_CURRENCIES").split(",").includes(currency?.id);
}

const nftCapabilities: Record<string, NFTStandard[]> = {
  hasQuantity: ["ERC1155"],
};

type NFTCapabilty = keyof typeof nftCapabilities;

export const getNftCapabilities = (
  nft: ProtoNFT | undefined | null,
): Record<NFTCapabilty, boolean> =>
  (Object.entries(nftCapabilities) as [NFTCapabilty, NFTStandard[]][]).reduce(
    (acc, [capability, standards]) => ({
      ...acc,
      [capability]: nft?.standard ? standards.includes(nft.standard) : false,
    }),
    {} as Record<NFTCapabilty, boolean>,
  );
