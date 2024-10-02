import { waitFor, renderHook } from "@testing-library/react";
import { SimpleHashResponse } from "@ledgerhq/live-nft/api/types";
import { notifyManager } from "@tanstack/react-query";

import { wrapper, generateNftsOwned } from "../../tools/helperTests";
import { useCheckNftAccount } from "../useCheckNftAccount";

jest.setTimeout(30000);

// invoke callback instantly
notifyManager.setScheduler(cb => cb());

const pagedBy = 5;

const nftsOwned = generateNftsOwned();
const expected = [...new Set(nftsOwned)];
expected.sort(() => Math.random() - 0.5);

const apiResults: SimpleHashResponse[] = [];
for (let i = 0; i < expected.length; i += pagedBy) {
  const slice = expected.slice(i, i + pagedBy);
  const apiResult = {
    next_cursor: i + pagedBy < expected.length ? String(i + pagedBy) : null,
    nfts: slice.map(nft => ({
      nft_id: nft.id,
      chain: "ethereum",
      contract_address: nft.contract,
      token_id: nft.tokenId,
      image_url: "",
      name: "",
      description: "",
      token_count: 1,
      collection: { name: "", spam_score: 0 },
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

    const pageIndex = Math.floor(index / pagedBy);
    if (!apiResults[pageIndex]) throw new Error("no such page");

    callCount++;
    return Promise.resolve(apiResults[pageIndex]);
  }),
}));

describe("useCheckNftAccount", () => {
  test("fetches all pages", async () => {
    const addresses = "0x34";
    const chains = ["ethereum"];

    const { result } = renderHook(
      () =>
        useCheckNftAccount({
          addresses,
          nftsOwned,
          chains,
          threshold: 80,
        }),
      {
        wrapper,
      },
    );

    await waitFor(() => !result.current.hasNextPage);

    expect(callCount).toBe(nftsOwned.length / pagedBy);
    expect(result.current.nfts.length).toEqual(nftsOwned.length);
  });
});
