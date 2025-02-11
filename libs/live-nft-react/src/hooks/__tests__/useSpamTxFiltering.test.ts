import { AccountLike, DailyOperations, NFTMetadataResponse, Operation } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-nft/types";
import { filterGroupedOperations, filterSection, useNftOperations } from "../useSpamTxFiltering";
import { renderHook } from "@testing-library/react";

const accountsMap = {
  acc1: { id: "acc1", currency: { id: "ETH" }, type: "Account" } as unknown as AccountLike,
  acc2: { id: "acc2", currency: { id: "ETH" }, type: "Account" } as unknown as AccountLike,
  acc3: { id: "acc3", currency: { id: "BTC" }, type: "Account" } as unknown as AccountLike,
};

const mockGroupedOperations: DailyOperations = {
  completed: true,
  sections: [
    {
      data: [
        {
          type: "NFT_IN",
          accountId: "acc1",
          contract: "contract-1",
          tokenId: "token-1",
          id: "op1",
        } as Operation,
        {
          type: "NFT_OUT",
          accountId: "acc2",
          contract: "contract-2",
          tokenId: "token-2",
          id: "op2",
        } as Operation,
        {
          type: "NFT_IN",
          accountId: "acc2",
          contract: "contract-3",
          tokenId: "token-3",
          id: "op3",
        } as Operation,
      ],
      day: new Date(),
    },
    {
      data: [
        {
          type: "NFT_IN",
          accountId: "acc1",
          contract: "contract-21",
          tokenId: "token-1",
          id: "op4",
        } as Operation,
      ],
      day: new Date(),
    },
  ],
};
const metadatas = [
  { metadata: { contract: "contract-1", spamScore: 30 } },
  { metadata: { contract: "contract-3", spamScore: 50 } },
] as unknown as Array<NFTResource<NonNullable<NFTMetadataResponse["result"]>>>;

const metadataMap = new Map([
  ["contract-1", 30], // NFT with spamScore 30 (should be kept)
  ["contract-3", 50], // NFT with spamScore 50 (should be filtered out)
]);

const mockMarkNftAsSpam = jest.fn();

describe("useOperationsList Hooks", () => {
  describe("useNftOperations", () => {
    it("should return an empty set when spam filtering is disabled", () => {
      const { result } = renderHook(() =>
        useNftOperations({
          accountsMap: accountsMap,
          groupedOperations: mockGroupedOperations,
          spamFilteringTxEnabled: false,
        }),
      );

      expect(result.current).toEqual({});
    });

    it("should return filtered NFT_IN operations when spam filtering is enabled", () => {
      const { result } = renderHook(() =>
        useNftOperations({
          accountsMap: accountsMap,
          groupedOperations: mockGroupedOperations,
          spamFilteringTxEnabled: true,
        }),
      );

      expect(result.current).toEqual({
        "contract-1": { contract: "contract-1", currencyId: "ETH" },
        "contract-3": { contract: "contract-3", currencyId: "ETH" },
        "contract-21": { contract: "contract-21", currencyId: "ETH" },
      });
    });

    it("should return an empty set if groupedOperations is undefined", () => {
      const { result } = renderHook(() =>
        useNftOperations({
          accountsMap: accountsMap,
          groupedOperations: undefined,
          spamFilteringTxEnabled: true,
        }),
      );

      expect(result.current).toEqual({});
    });
  });

  describe("filterSection", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockOperations: Operation[] = [
      {
        type: "NFT_IN",
        accountId: "acc1",
        contract: "contract-1",
        id: "op1",
      } as Operation,
      {
        type: "NFT_IN",
        accountId: "acc2",
        contract: "contract-3",
        id: "op2",
      } as Operation,
      { type: "FEES", accountId: "acc3", contract: "ca3", id: "op3" } as Operation,
    ];

    it("should filter out NFTs with spamScore greater than 40", () => {
      const result = filterSection(mockOperations, metadataMap, accountsMap, mockMarkNftAsSpam, 40);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { type: "NFT_IN", accountId: "acc1", contract: "contract-1", id: "op1" }, // Kept (score 30)
        { type: "FEES", accountId: "acc3", contract: "ca3", id: "op3" }, // Kept (not NFT_IN)
      ]);
    });

    it("should call markNftAsSpam for NFTs with a defined spamScore", () => {
      filterSection(mockOperations, metadataMap, accountsMap, mockMarkNftAsSpam, 40);

      expect(mockMarkNftAsSpam).toHaveBeenCalledTimes(1);
      expect(mockMarkNftAsSpam).toHaveBeenCalledWith("acc2|contract-3", "ETH", 50);
    });

    it("should keep non-NFT_IN operations", () => {
      const result = filterSection(mockOperations, metadataMap, accountsMap);

      expect(result).toContainEqual({
        type: "FEES",
        accountId: "acc3",
        contract: "ca3",
        id: "op3",
      });
    });

    it("should keep NFTs without a spamScore", () => {
      const newMetadataMap = new Map(); // No spam scores
      const result = filterSection(mockOperations, newMetadataMap, accountsMap);

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockOperations);
    });
  });

  describe("filterGroupedOperations", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return an empty object if groupedOperations is undefined", () => {
      const result = filterGroupedOperations(metadatas, accountsMap);
      expect(result).toEqual({});
    });

    it("should use metadataMap to filter sections & respect the threshold", () => {
      const result = filterGroupedOperations(
        metadatas,
        accountsMap,
        mockGroupedOperations,
        mockMarkNftAsSpam,
        40,
      );
      expect(result.sections?.[0].data).toHaveLength(2);
      expect(result.sections?.[1].data).toHaveLength(1);
      expect(result.sections?.[0].data[0].contract).toBe("contract-1");
    });
  });
});
