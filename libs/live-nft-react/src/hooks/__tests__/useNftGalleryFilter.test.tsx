import { BigNumber } from "bignumber.js";
import { waitFor, act, renderHook } from "@testing-library/react";
import { isThresholdValid, useNftGalleryFilter } from "../useNftGalleryFilter";
import { NFTs } from "@ledgerhq/coin-framework/mocks/fixtures/nfts";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { SimpleHashResponse } from "@ledgerhq/live-nft/api/types";
import { notifyManager } from "@tanstack/react-query";

import { wrapper } from "../../tools/helperTests";

jest.setTimeout(30000);

// invoke callback instantly
notifyManager.setScheduler(cb => cb());

type FakeNFTRaw = {
  id: string;
  tokenId: string;
  amount: BigNumber;
  contract: string;
  standard: "ERC721";
  currencyId: string;
  metadata: undefined;
};
const generateNftsOwned = () => {
  const nfts: FakeNFTRaw[] = [];

  NFTs.forEach(nft => {
    for (let i = 1; i <= 20; i++) {
      nfts.push({
        id: encodeNftId("foo", nft.collection.contract, String(i), "ethereum"),
        tokenId: String(i),
        amount: new BigNumber(0),
        contract: nft.collection.contract,
        standard: "ERC721" as const,
        currencyId: "ethereum",
        metadata: undefined,
      });
    }
  });

  return nfts;
};

// TODO better way to make ProtoNFT[] collection
const nftsOwned = generateNftsOwned();
let expected = [...new Set(nftsOwned)];
expected.sort(() => Math.random() - 0.5);
expected = expected.slice(3);

const pagedBy = 3;
const apiResults: SimpleHashResponse[] = [];
for (let i = 0; i < expected.length; i += pagedBy) {
  const slice = expected.slice(i, i + pagedBy);
  const apiResult = {
    next_cursor: i + pagedBy < expected.length ? String(i + 1) : null,
    nfts: slice.map(nft => ({
      nft_id: nft.id,
      chain: "ethereum",
      contract_address: nft.contract,
      token_id: nft.tokenId,
      image_url: "",
      name: "",
      description: "",
      token_count: 1,
      collection: { name: "" },
      contract: { type: "ERC721" },
      extra_metadata: {
        image_original_url: "",
        animation_original_url: "",
      },
    })),
  };
  apiResults.push(apiResult);
}

let callCount = 0;

jest.mock("@ledgerhq/live-nft/api/simplehash", () => ({
  fetchNftsFromSimpleHash: jest.fn().mockImplementation(opts => {
    const { cursor } = opts;
    const index = cursor ? Number(cursor) : 0;
    if (!apiResults[index]) throw new Error("no such page");
    callCount++;
    return Promise.resolve(apiResults[index]);
  }),
}));

describe("useNftGalleryFilter", () => {
  test("fetches multiple page", async () => {
    const addresses = "...";
    const chains = ["ethereum"];

    const { result } = renderHook(
      () =>
        useNftGalleryFilter({
          addresses,
          nftsOwned,
          chains,
          threshold: 80,
        }),
      {
        wrapper,
      },
    );

    await waitFor(() => result.current.data);

    expect(callCount).toBe(1);
    expect(result.current.nfts).toEqual(expected.slice(0, pagedBy));

    await act(() => result.current.fetchNextPage());
    expect(callCount).toBe(2);
    expect(result.current.nfts).toEqual(expected.slice(0, pagedBy * 2));

    // FIXME something not working here

    // let n = 2;
    // while (result.current.hasNextPage) {
    //   await act(() => result.current.fetchNextPage());
    //   expect(callCount).toBe(++n);
    //   expect(result.current.nfts).toBe(expected.slice(0, pagedBy * n));
    // }
    // expect(result.current.nfts).toEqual(expected);
  });

  test("Threshold validity", async () => {
    expect(isThresholdValid(101)).toBe(false);
    expect(isThresholdValid(-1)).toBe(false);
    expect(isThresholdValid("-1")).toBe(false);
    expect(isThresholdValid("40")).toBe(true);
    expect(isThresholdValid("101")).toBe(false);
    expect(isThresholdValid("Not a number")).toBe(false);
  });
});
