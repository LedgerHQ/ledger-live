import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { BigNumber } from "bignumber.js";
import { NFTs } from "@ledgerhq/coin-framework/mocks/fixtures/nfts";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";

const queryClient = new QueryClient();

export const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export type FakeNFTRaw = {
  id: string;
  tokenId: string;
  amount: BigNumber;
  contract: string;
  standard: "ERC721";
  currencyId: string;
};

export const generateNftsOwned = () => {
  const nfts: FakeNFTRaw[] = [];

  NFTs.forEach(nft => {
    for (let i = 1; i <= 20; i++) {
      nfts.push(generateNft(nft.collection.contract, String(i)));
    }
  });

  return nfts;
};

export const generateNft = (contract: string, tokenId: string): FakeNFTRaw => ({
  id: encodeNftId("foo", contract, tokenId, "ethereum"),
  tokenId: tokenId,
  amount: new BigNumber(0),
  contract: contract,
  standard: "ERC721" as const,
  currencyId: "ethereum",
});
