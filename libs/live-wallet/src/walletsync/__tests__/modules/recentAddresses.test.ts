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
});

//sameDistantState x 558,365 ops/sec ±1.50% (96 runs sampled)
