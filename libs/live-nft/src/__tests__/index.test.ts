import BigNumber from "bignumber.js";
import { NFTStandard } from "@ledgerhq/types-live";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { getNFT, getNftCollectionKey, getNftKey, groupByCurrency, mapChain, mapChains } from "..";
import { SupportedBlockchain } from "../supported";

const NFT_1 = {
  id: encodeNftId("js:2:0ddkdlsPmds", "contract", "nft.tokenId", "ethereum"),
  tokenId: "nft.tokenId",
  amount: new BigNumber(0),
  contract: "contract",
  standard: "ERC721" as NFTStandard,
  currencyId: "ethereum",
};
const NFT_2 = {
  id: encodeNftId("js:2:0ddkdlzzZCF", "contract-pol", "nft.tokenId3", "polygon"),
  tokenId: "nft.tokenId3",
  amount: new BigNumber(0),
  contract: "contract-pol",
  standard: "ERC1155" as NFTStandard,
  currencyId: "polygon",
};
const NFT_3 = {
  id: encodeNftId("js:2:0ddkdlzzzOxf", "contract", "nft.tokenId4", "polygon"),
  tokenId: "nft.tokenId4",
  amount: new BigNumber(1),
  contract: "contract",
  standard: "ERC721" as NFTStandard,
  currencyId: "polygon",
};
const NFT_4 = {
  id: encodeNftId("js:2:0ddkdlzzAZ", "contract-eth", "nft.tokenId2", "ethereum"),
  tokenId: "nft.tokenId2",
  amount: new BigNumber(0),
  contract: "contract-eth",
  standard: "ERC721" as NFTStandard,
  currencyId: "ethereum",
};
const NFTs = [NFT_1, NFT_2, NFT_3, NFT_4];

describe("Helpers functions", () => {
  it("should return Nft key", () => {
    expect(getNftKey("contract", "tokenId", "currencyId")).toEqual("currencyId-contract-tokenId");
  });
  it("should get NftCollection Key", () => {
    expect(getNftCollectionKey("contract", "currencyId")).toEqual("currencyId-contract");
  });
  it("should ge NFT", () => {
    expect(getNFT("contract", "nft.tokenId", NFTs)).toEqual(NFT_1);
  });

  it("should group by Currency", () => {
    expect(groupByCurrency(NFTs)).toEqual([NFT_1, NFT_4, NFT_2, NFT_3]);
  });

  it("should map a single chain", () => {
    expect(mapChain(SupportedBlockchain.Avalanche)).toEqual("avalanche");
  });

  it("should map all chains", () => {
    expect(mapChains([SupportedBlockchain.Avalanche, SupportedBlockchain.Ethereum])).toEqual([
      "avalanche",
      "ethereum",
    ]);
  });
});
