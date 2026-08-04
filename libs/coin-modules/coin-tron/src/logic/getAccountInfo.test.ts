import BigNumber from "bignumber.js";
import { getTronAccountNetwork } from "../network";
import type { NetworkInfo } from "../types";
import { getAccountInfo, TronAccountInfo } from "./getAccountInfo";

jest.mock("../network", () => ({
  getTronAccountNetwork: jest.fn(),
}));

const mockGetTronAccountNetwork = jest.mocked(getTronAccountNetwork);

const buildNetworkInfo = (overrides: Partial<NetworkInfo> = {}): NetworkInfo => ({
  family: "tron",
  freeNetUsed: new BigNumber(0),
  freeNetLimit: new BigNumber(0),
  netUsed: new BigNumber(0),
  netLimit: new BigNumber(0),
  energyUsed: new BigNumber(0),
  energyLimit: new BigNumber(0),
  ...overrides,
});

describe("getAccountInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("polls wallet/getaccountresource for the given address", async () => {
    mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());

    await getAccountInfo("TXYZ");

    expect(mockGetTronAccountNetwork).toHaveBeenCalledWith("TXYZ");
  });

  it("returns available energy/bandwidth and the raw energy limit", async () => {
    mockGetTronAccountNetwork.mockResolvedValueOnce(
      buildNetworkInfo({
        energyLimit: new BigNumber(100_000),
        energyUsed: new BigNumber(58_000),
        freeNetLimit: new BigNumber(600),
        freeNetUsed: new BigNumber(100),
        netLimit: new BigNumber(5_400),
        netUsed: new BigNumber(4_400),
      }),
    );

    const info = (await getAccountInfo("TXYZ")) as TronAccountInfo;

    expect(info).toEqual({
      type: "tron",
      energyLimit: 100_000,
      energy: 42_000, // 100_000 - 58_000
      bandwidth: 1_500, // (600 - 100) + (5_400 - 4_400)
    });
  });

  it("clamps available amounts to zero when usage exceeds the limit", async () => {
    mockGetTronAccountNetwork.mockResolvedValueOnce(
      buildNetworkInfo({
        energyLimit: new BigNumber(1_000),
        energyUsed: new BigNumber(1_500),
        freeNetLimit: new BigNumber(100),
        freeNetUsed: new BigNumber(250),
        netLimit: new BigNumber(300),
        netUsed: new BigNumber(50),
      }),
    );

    const info = (await getAccountInfo("TXYZ")) as TronAccountInfo;

    // energy clamped to 0; bandwidth = max(0, 100-250) + max(0, 300-50) = 0 + 250
    expect(info).toEqual({
      type: "tron",
      energyLimit: 1_000,
      energy: 0,
      bandwidth: 250,
    });
  });

  it("returns zeroed metadata for an account with no resources", async () => {
    mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());

    const info = (await getAccountInfo("TXYZ")) as TronAccountInfo;

    expect(info).toEqual({
      type: "tron",
      energyLimit: 0,
      energy: 0,
      bandwidth: 0,
    });
  });
});
