/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { RecentAddressesState } from "@ledgerhq/types-live";
import { WalletSyncDataManagerResolutionContext } from "../../types";
import manager, { DistantRecentAddressesState } from "../../modules/recentAddresses";

describe("recentAddress", () => {
  describe("diffLocalToDistant", () => {
    it.each([
      {
        localData: {} as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {} as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
        } as RecentAddressesState,
        latestState: {} as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          solana: [{ address: "some random address", lastUsed: 1 }],
        } as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
          solana: [
            { address: "some random address on Solana", lastUsed: 1 },
            { address: "some random address on Solana 2", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
          solana: [
            { address: "some random address on Solana 2", lastUsed: 2 },
            { address: "some random address on Solana 3", lastUsed: 3 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
          solana: [
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
            { address: "some random address on Solana 2", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
    ])(
      "should return true when local data is different from latest state #%#",
      ({ localData, latestState }) => {
        const result = manager.diffLocalToDistant(localData, latestState);

        expect(result).toEqual({
          hasChanges: true,
          nextState: expect.any(Object),
        });

        Object.entries(localData).forEach(([key, value]) => {
          const nextState = result.nextState;
          expect(nextState[key]).toEqual(
            expect.arrayContaining(
              value.map((entry, index) => ({
                address: entry.address,
                index,
                lastUsed: entry.lastUsed,
              })),
            ),
          );
        });
      },
    );

    it.each([
      {
        localData: {} as RecentAddressesState,
        latestState: {} as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
        } as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [
            { address: "some random address 2", index: 1, lastUsed: 2 },
            { address: "some random address", index: 0, lastUsed: 1 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        latestState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        latestState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        latestState: {
          ethereum: [
            { address: "some random address 2", index: 1, lastUsed: 2 },
            { address: "some random address", index: 0, lastUsed: 1 },
          ],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", lastUsed: 1 },
            { address: "some random address 2 on Solana", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
            { address: "some random address 2 on Solana", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", lastUsed: 1 },
            { address: "some random address 2 on Solana", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
          solana: [
            { address: "some random address 2 on Solana", index: 1, lastUsed: 2 },
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", lastUsed: 1 },
            { address: "some random address 2 on Solana", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        latestState: {
          ethereum: [
            { address: "some random address 2", index: 1, lastUsed: 2 },
            { address: "some random address", index: 0, lastUsed: 1 },
          ],
          solana: [
            { address: "some random address 2 on Solana", index: 1, lastUsed: 2 },
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
          ],
        } as DistantRecentAddressesState,
      },
    ])(
      "should return false when latest data and latest state have the same data #%#",
      ({ localData, latestState }) => {
        const result = manager.diffLocalToDistant(localData, latestState);
        expect(result).toEqual({
          hasChanges: false,
          nextState: latestState,
        });
      },
    );
  });

  describe("resolveIncrementalUpdate", () => {
    it("should return no changes when there is no incoming state #%#", async () => {
      const result = await manager.resolveIncrementalUpdate(
        {} as unknown as WalletSyncDataManagerResolutionContext,
        {},
        {},
        undefined as unknown as DistantRecentAddressesState,
      );
      expect(result).toEqual({
        hasChanges: false,
      });
    });

    it.each([
      [{} as DistantRecentAddressesState],
      [
        {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      ],
      [
        {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      ],
    ])(
      "should return no changes when latest state and incoming state are the same",
      async (state: DistantRecentAddressesState) => {
        const result = await manager.resolveIncrementalUpdate(
          {} as unknown as WalletSyncDataManagerResolutionContext,
          {},
          state,
          state,
        );
        expect(result).toEqual({
          hasChanges: false,
        });
      },
    );

    it.each([
      {
        localData: {} as RecentAddressesState,
        incomingState: {} as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address 2", index: 1, lastUsed: 2 },
            { address: "some random address", index: 0, lastUsed: 1 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address 2", index: 1, lastUsed: 2 },
            { address: "some random address", index: 0, lastUsed: 1 },
          ],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", lastUsed: 1 },
            { address: "some random address 2 on Solana", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
            { address: "some random address 2 on Solana", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", lastUsed: 1 },
            { address: "some random address 2 on Solana", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
          solana: [
            { address: "some random address 2 on Solana", index: 1, lastUsed: 2 },
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", lastUsed: 1 },
            { address: "some random address 2 on Solana", lastUsed: 2 },
          ],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address 2", index: 1, lastUsed: 2 },
            { address: "some random address", index: 0, lastUsed: 1 },
          ],
          solana: [
            { address: "some random address 2 on Solana", index: 1, lastUsed: 2 },
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
          ],
        } as DistantRecentAddressesState,
      },
    ])(
      "should return no changes when local data and incoming state have the same data #%#",
      async ({ localData, incomingState }) => {
        const result = await manager.resolveIncrementalUpdate(
          {} as unknown as WalletSyncDataManagerResolutionContext,
          localData,
          {},
          incomingState,
        );
        expect(result).toEqual({
          hasChanges: false,
        });
      },
    );

    it.each([
      {
        localData: {} as RecentAddressesState,
        incomingState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", index: 0, lastUsed: 1 }],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [{ address: "some random address", index: 0, lastUsed: 1 }],
          solana: [
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
            { address: "some random address on Solana 2", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
      {
        localData: {
          ethereum: [{ address: "some random address", lastUsed: 1 }],
          solana: [{ address: "some random address on Solana", lastUsed: 1 }],
        } as RecentAddressesState,
        incomingState: {
          ethereum: [
            { address: "some random address", index: 0, lastUsed: 1 },
            { address: "some random address 2", index: 1, lastUsed: 2 },
          ],
          solana: [
            { address: "some random address on Solana", index: 0, lastUsed: 1 },
            { address: "some random address on Solana 2", index: 1, lastUsed: 2 },
          ],
        } as DistantRecentAddressesState,
      },
    ])(
      "should return changes present local data is different from incoming state #%#",
      async ({ localData, incomingState }) => {
        const result = await manager.resolveIncrementalUpdate(
          {} as unknown as WalletSyncDataManagerResolutionContext,
          localData,
          {},
          incomingState,
        );

        const update: RecentAddressesState = {};
        Object.keys(incomingState).forEach(key => {
          update[key] = incomingState[key]
            .sort((current, other) => current.index - other.index)
            .map(data => ({ address: data.address, lastUsed: data.lastUsed ?? Date.now() }));
        });

        expect(result).toEqual({
          hasChanges: true,
          update,
        });
      },
    );
  });

  describe("applyUpdate", () => {
    it.each([
      [{}],
      [{ ethereum: [{ address: "some random address", lastUsed: 1 }] }],
      [
        {
          ethereum: [
            { address: "some random address", lastUsed: 1 },
            { address: "some random address 2", lastUsed: 2 },
          ],
        },
      ],
    ])("should return updated data #%#", (update: RecentAddressesState) => {
      const result = manager.applyUpdate({}, update);
      expect(result).toEqual(update);
    });
  });

  describe("schema validation - handling corrupted data", () => {
    it("should validate and accept correct format", () => {
      const data = {
        ethereum: [
          { address: "0x123", index: 0, lastUsed: 1234567890 },
          { address: "0x456", index: 1, lastUsed: 1234567891 },
        ],
      };

      const result = manager.schema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          ethereum: [
            { address: "0x123", index: 0, lastUsed: 1234567890 },
            { address: "0x456", index: 1, lastUsed: 1234567891 },
          ],
        });
      }
    });

    it("should handle corrupted nested address structure", () => {
      const corruptedData = {
        ethereum: [
          {
            address: {
              address: "0x123",
              lastUsed: 1234567890,
            },
            index: 0,
          },
        ],
      };

      const result = manager.schema.safeParse(corruptedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          ethereum: [{ address: "0x123", index: 0, lastUsed: 1234567890 }],
        });
      }
    });

    it("should handle corrupted nested address with ensName", () => {
      const corruptedData = {
        ethereum: [
          {
            address: {
              address: "0x123",
              lastUsed: 1234567890,
              ensName: "vitalik.eth",
            },
            index: 0,
            lastUsed: 1234567891,
          },
        ],
      };

      const result = manager.schema.safeParse(corruptedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ethereum[0]).toMatchObject({
          address: "0x123",
          index: 0,
        });
        expect(result.data.ethereum[0].lastUsed).toBeDefined();
      }
    });

    it("should filter out invalid entries while keeping valid ones", () => {
      const mixedData = {
        ethereum: [
          { address: "0x123", index: 0, lastUsed: 1234567890 }, // valid
          { address: { address: "0x456", lastUsed: 1234567891 }, index: 1 }, // corrupted but recoverable
          null, // invalid - should be filtered
          { address: "0x789", index: 2 }, // valid without lastUsed
        ],
      };

      const result = manager.schema.safeParse(mixedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ethereum).toHaveLength(3);
        expect(result.data.ethereum[0]).toMatchObject({ address: "0x123", index: 0 });
        expect(result.data.ethereum[1]).toMatchObject({ address: "0x456", index: 1 });
        expect(result.data.ethereum[2]).toMatchObject({ address: "0x789", index: 2 });
      }
    });

    it("should handle multiple currencies with mixed corruption", () => {
      const mixedData = {
        ethereum: [
          { address: "0x123", index: 0, lastUsed: 1234567890 },
          { address: { address: "0x456", lastUsed: 1234567891 }, index: 1 },
        ],
        bitcoin: [{ address: "bc1q...", index: 0, lastUsed: 1234567892 }],
        solana: [
          { address: { address: "sol123", lastUsed: 1234567893 }, index: 0 },
          { address: "sol456", index: 1, lastUsed: 1234567894 },
        ],
      };

      const result = manager.schema.safeParse(mixedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ethereum).toHaveLength(2);
        expect(result.data.bitcoin).toHaveLength(1);
        expect(result.data.solana).toHaveLength(2);
        expect(result.data.ethereum[0].address).toBe("0x123");
        expect(result.data.ethereum[1].address).toBe("0x456");
        expect(result.data.solana[0].address).toBe("sol123");
        expect(result.data.solana[1].address).toBe("sol456");
      }
    });

    it("should filter out entries with completely invalid structure", () => {
      const invalidData = {
        ethereum: [
          { address: "0x123", index: 0, lastUsed: 1234567890 }, // valid
          { invalid: "structure" }, // invalid
          42, // invalid
          "string", // invalid
          [], // invalid
          { address: "0x456", index: 1 }, // valid
        ],
      };

      const result = manager.schema.safeParse(invalidData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ethereum).toHaveLength(2);
        expect(result.data.ethereum[0]).toMatchObject({ address: "0x123", index: 0 });
        expect(result.data.ethereum[1]).toMatchObject({ address: "0x456", index: 1 });
      }
    });

    it("should handle empty arrays", () => {
      const data = {
        ethereum: [],
      };

      const result = manager.schema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ethereum).toEqual([]);
      }
    });

    it("should handle corrupted data without lastUsed in nested address", () => {
      const corruptedData = {
        ethereum: [
          {
            address: {
              address: "0x123",
            },
            index: 0,
            lastUsed: 1234567890,
          },
        ],
      };

      const result = manager.schema.safeParse(corruptedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ethereum[0]).toMatchObject({
          address: "0x123",
          index: 0,
          lastUsed: 1234567890,
        });
      }
    });
  });
});

//sameDistantState x 558,365 ops/sec ±1.50% (96 runs sampled)
