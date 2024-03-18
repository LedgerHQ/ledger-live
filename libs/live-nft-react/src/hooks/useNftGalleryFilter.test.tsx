import React, { ReactNode } from "react";
import { BigNumber } from "bignumber.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { isThresholdValid, useNftGalleryFilter } from "./useNftGalleryFilter";
import { NFTs } from "@ledgerhq/coin-framework/mocks/fixtures/nfts";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { SimpleHashResponse } from "@ledgerhq/live-nft/api/types";
import { notifyManager } from "@tanstack/react-query";

jest.setTimeout(30000);

// invoke callback instantly
notifyManager.setScheduler(cb => cb());

// TODO better way to make ProtoNFT[] collection
const nftsOwned = NFTs.map(nft => ({
  id: encodeNftId("foo", nft.collection.contract, nft.tokenId, "ethereum"),
  tokenId: nft.tokenId,
  amount: new BigNumber(0),
  contract: nft.collection.contract,
  standard: "ERC721" as const,
  currencyId: "ethereum",
  metadata: undefined,
}));

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

    const queryClient = new QueryClient();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

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

    await act(() => expect(callCount).toBe(1));
    await act(() => expect(result.current.nfts).toEqual(expected.slice(0, pagedBy)));

    result.current.fetchNextPage();

    await act(() => expect(callCount).toBe(2));
    await act(() => expect(result.current.nfts).toEqual(expected.slice(0, pagedBy * 2)));

    // FIXME something not working here
    /*
    let n = 2;
    while (result.current.hasNextPage) {
      console.warn("fetching next page", n);
      await act(() => result.current.fetchNextPage());
      await act(() => expect(callCount).toBe(++n));
      await act(() => expect(result.current.nfts).toBe(expected.slice(0, pagedBy * n)));
    }
    await act(() => expect(result.current.nfts).toEqual(expected));
    */
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
