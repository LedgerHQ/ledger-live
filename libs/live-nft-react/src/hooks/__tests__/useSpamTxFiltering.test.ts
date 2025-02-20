// debug operations tests

import { renderHook } from "@testing-library/react";
import { useSpamTxFiltering } from "../useSpamTxFiltering";
import { wrapper } from "../../tools/helperTests";
import { useContext } from "react";
import {
  MOCK_CACHE_WITH_ALL_SPAMS,
  MOCK_INDEXED_NFT_OPS,
  MOCK_NFT_OPS,
} from "./nftMocks";

// Mock the NftMetadataContext
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useContext: jest.fn(),
}));

const mockContextValue = {
  loadNFTMetadata: jest.fn(),
  loadCollectionMetadata: jest.fn(),
  clearCache: jest.fn(),
};

describe("useSpamTxFiltering", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("sould retrun all nfts related to accounts where scoreSpam is not reaching the threshold", () => {
    (useContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      cache: MOCK_CACHE_WITH_ALL_SPAMS,
    });
    const { result } = renderHook(
      () => useSpamTxFiltering(70, MOCK_INDEXED_NFT_OPS, MOCK_NFT_OPS),
      {
        wrapper,
      },
    );

    expect(result.current.data.length).toEqual(MOCK_NFT_OPS.length);
  });

  /* it("should return empty sections where all the related transaction contains nft spams", () => {
    (useContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      cache: MOCK_CACHE_WITH_ALL_SPAMS,
    });
    const { result } = renderHook(
      () =>
        useSpamTxFiltering(
          true,
          MOCK_ACCOUNTS as any,
          MOCK_GROUPED_OPS as any,
          () => console.log("set Status"),
          50,
        ),
      {
        wrapper,
      },
    );
    const emptySections = {
      sections: [
        {
          day: "2025-01-22T23:00:00.000Z",
          data: [],
        },
        {
          day: "2025-01-21T23:00:00.000Z",
          data: [],
        },
      ],
      completed: false,
    };
    expect(result.current).toEqual(emptySections);
  }); */
});
