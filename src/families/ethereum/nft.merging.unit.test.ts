import "../../__tests__/test-helpers/setup";
import BigNumber from "bignumber.js";
import { toNFTRaw } from "../../account";
import type { NFT } from "../../types";
import { mergeNfts } from "../../bridge/jsHelpers";
import { encodeNftId } from "../../nft";

describe("nft merging", () => {
  const makeNFT = (tokenId: string, contract: string, amount: number): NFT => ({
    id: encodeNftId("test", contract, tokenId),
    tokenId,
    amount: new BigNumber(amount),
    collection: {
      contract,
      standard: "erc721",
    },
  });
  const oldNfts = [
    makeNFT("1", "contract1", 10),
    makeNFT("2", "contract1", 1),
    makeNFT("3", "contract2", 6),
  ];

  test("should remove first NFT and return new array with same refs", () => {
    const nfts = [makeNFT("2", "contract1", 1), makeNFT("3", "contract2", 6)];
    const newNfts = mergeNfts(oldNfts, nfts);

    expect(newNfts.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[1]).toBe(newNfts[0]);
    expect(oldNfts[2]).toBe(newNfts[1]);
  });

  test("should remove any NFT and return new array with same refs", () => {
    const nfts = [makeNFT("1", "contract1", 10), makeNFT("3", "contract2", 6)];
    const newNfts = mergeNfts(oldNfts, nfts);

    expect(newNfts.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[0]).toBe(newNfts[0]);
    expect(oldNfts[2]).toBe(newNfts[1]);
  });

  test("should change NFT amount and return new array with new ref", () => {
    const nfts = [
      makeNFT("1", "contract1", 10),
      makeNFT("2", "contract1", 5),
      makeNFT("3", "contract2", 6),
    ];
    const addToNft1 = mergeNfts(oldNfts, nfts);

    expect(addToNft1.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[0]).toBe(addToNft1[0]);
    expect(oldNfts[1]).not.toBe(addToNft1[1]);
    expect(oldNfts[2]).toBe(addToNft1[2]);
  });

  test("should add NFT and return new array with new ref", () => {
    const nfts = [
      makeNFT("1", "contract1", 10),
      makeNFT("2", "contract1", 1),
      makeNFT("3", "contract2", 6),
      makeNFT("4", "contract2", 4),
    ];
    const addToNft1 = mergeNfts(oldNfts, nfts);

    expect(addToNft1.map(toNFTRaw)).toEqual(
      [
        makeNFT("4", "contract2", 4),
        makeNFT("1", "contract1", 10),
        makeNFT("2", "contract1", 1),
        makeNFT("3", "contract2", 6),
      ].map(toNFTRaw)
    );
    expect(oldNfts[0]).toBe(addToNft1[1]);
    expect(oldNfts[1]).toBe(addToNft1[2]);
    expect(oldNfts[2]).toBe(addToNft1[3]);
    expect(addToNft1[0]).toBe(nfts[3]);
  });
});
