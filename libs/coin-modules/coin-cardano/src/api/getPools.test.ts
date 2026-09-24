import network from "@ledgerhq/live-network/network";
import { fetchPoolDetails } from "./getPools";
import { mockCardanoConfig } from "../test/coinConfig";

jest.mock("@ledgerhq/live-network/network");

const poolIds = ["pool1", "pool2", "pool3"];

describe("fetchPoolDetails with sorted data", () => {
  it("success with 200", async () => {
    (network as jest.Mock).mockImplementation(() => ({
      data: {
        pools: [
          {
            poolId: "pool1",
            name: "Ledger by Figment 1",
            ticker: "LBF4",
            liveStake: "12345",
          },
          {
            poolId: "pool2",
            name: "Ledger by Figment 2",
            ticker: "LBF2",
            liveStake: "123",
          },
          {
            poolId: "pool3",
            name: "Ledger by Figment 3",
            ticker: "LBF1",
            liveStake: "1234",
          },
        ],
      },
    }));

    const result = await fetchPoolDetails(mockCardanoConfig, poolIds);

    expect(result.pools).toStrictEqual([
      {
        poolId: "pool2",
        name: "Ledger by Figment 2",
        ticker: "LBF2",
        liveStake: "123",
      },
      {
        poolId: "pool3",
        name: "Ledger by Figment 3",
        ticker: "LBF1",
        liveStake: "1234",
      },
      {
        poolId: "pool1",
        name: "Ledger by Figment 1",
        ticker: "LBF4",
        liveStake: "12345",
      },
    ]);
  });

  it("returns empty pools array when API returns no pools", async () => {
    (network as jest.Mock).mockImplementation(() => ({
      data: { pools: [] },
    }));

    const result = await fetchPoolDetails(mockCardanoConfig, poolIds);

    expect(result.pools).toStrictEqual([]);
  });

  it("sorts pools with equal liveStake values in stable order (preserves original order)", async () => {
    const poolsWithEqualStake = {
      pools: [
        { poolId: "first", name: "First", ticker: "FST", liveStake: "1000" },
        { poolId: "second", name: "Second", ticker: "SND", liveStake: "1000" },
        { poolId: "third", name: "Third", ticker: "TRD", liveStake: "1000" },
      ],
    };
    (network as jest.Mock).mockImplementation(() => ({
      data: poolsWithEqualStake,
    }));

    const result = await fetchPoolDetails(mockCardanoConfig, ["first", "second", "third"]);

    expect(result.pools).toStrictEqual([
      { poolId: "first", name: "First", ticker: "FST", liveStake: "1000" },
      { poolId: "second", name: "Second", ticker: "SND", liveStake: "1000" },
      { poolId: "third", name: "Third", ticker: "TRD", liveStake: "1000" },
    ]);
  });

  it("sorts pools with very large liveStake values correctly", async () => {
    const poolsWithLargeStake = {
      pools: [
        {
          poolId: "huge",
          name: "Huge Pool",
          ticker: "HUG",
          liveStake: "999999999999999999999999",
        },
        {
          poolId: "small",
          name: "Small Pool",
          ticker: "SML",
          liveStake: "1000000000000000000",
        },
        {
          poolId: "medium",
          name: "Medium Pool",
          ticker: "MED",
          liveStake: "500000000000000000000000",
        },
      ],
    };
    (network as jest.Mock).mockImplementation(() => ({
      data: poolsWithLargeStake,
    }));

    const result = await fetchPoolDetails(mockCardanoConfig, ["huge", "small", "medium"]);

    expect(result.pools).toStrictEqual([
      {
        poolId: "small",
        name: "Small Pool",
        ticker: "SML",
        liveStake: "1000000000000000000",
      },
      {
        poolId: "medium",
        name: "Medium Pool",
        ticker: "MED",
        liveStake: "500000000000000000000000",
      },
      {
        poolId: "huge",
        name: "Huge Pool",
        ticker: "HUG",
        liveStake: "999999999999999999999999",
      },
    ]);
  });

  it("propagates error when network call fails", async () => {
    const networkError = new Error("Network request failed");
    (network as jest.Mock).mockRejectedValue(networkError);

    await expect(fetchPoolDetails(mockCardanoConfig, poolIds)).rejects.toThrow(
      "Network request failed",
    );
  });
});
