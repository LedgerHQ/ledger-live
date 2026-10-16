import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TronCoinConfig } from "../config";
import BigNumber from "bignumber.js";
import { fetchTronAccount, getTronAccountNetwork } from "../network";
import type { AccountTronAPI } from "../network/types";
import type { NetworkInfo, TronResources } from "../types";
import { getAccountInfo, TronAccountInfo } from "./getAccountInfo";
import { fetchTronResources } from "./tronResources";

jest.mock("../network", () => ({
  fetchTronAccount: jest.fn(),
  getTronAccountNetwork: jest.fn(),
}));

jest.mock("./tronResources", () => ({
  fetchTronResources: jest.fn(),
}));

const mockGetTronAccountNetwork = jest.mocked(getTronAccountNetwork);
const mockFetchTronAccount = jest.mocked(fetchTronAccount);
const mockFetchTronResources = jest.mocked(fetchTronResources);

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

const mockLogger: Logger = jest.fn();

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

describe("getAccountInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTronAccount.mockResolvedValue([]);
  });

  it("polls wallet/getaccountresource for the given address", async () => {
    mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());

    await getAccountInfo(mockLogger, mockConfig, "TXYZ");

    expect(mockGetTronAccountNetwork).toHaveBeenCalledWith(mockLogger, mockConfig, "TXYZ");
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

    const info = (await getAccountInfo(mockLogger, mockConfig, "TXYZ")) as TronAccountInfo;

    expect(info).toEqual({
      type: "tron",
      energyLimit: 100_000,
      energy: 42_000, // 100_000 - 58_000
      bandwidth: 1_500, // (600 - 100) + (5_400 - 4_400)
      activated: false,
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

    const info = (await getAccountInfo(mockLogger, mockConfig, "TXYZ")) as TronAccountInfo;

    // energy clamped to 0; bandwidth = max(0, 100-250) + max(0, 300-50) = 0 + 250
    expect(info).toEqual({
      type: "tron",
      energyLimit: 1_000,
      energy: 0,
      bandwidth: 250,
      activated: false,
    });
  });

  it("returns zeroed metadata for an account with no resources", async () => {
    mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());

    const info = (await getAccountInfo(mockLogger, mockConfig, "TXYZ")) as TronAccountInfo;

    expect(info).toEqual({
      type: "tron",
      energyLimit: 0,
      energy: 0,
      bandwidth: 0,
      activated: false,
    });
  });

  describe("activation and resources", () => {
    const account = { address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c" } as AccountTronAPI;
    const resources: TronResources = {
      frozen: { bandwidth: { amount: new BigNumber(1_000_000) }, energy: undefined },
      unFrozen: {
        bandwidth: [
          { amount: new BigNumber(2_000_000), expireTime: new Date("2026-01-02T00:00:00.000Z") },
        ],
        energy: undefined,
      },
      delegatedFrozen: { bandwidth: undefined, energy: { amount: new BigNumber(3_000_000) } },
      legacyFrozen: { bandwidth: undefined, energy: undefined },
      votes: [{ name: "Ledger", address: "TLedger", voteCount: 4 }],
      tronPower: 6,
      energy: new BigNumber(42_000),
      bandwidth: {
        freeUsed: new BigNumber(100),
        freeLimit: new BigNumber(600),
        gainedUsed: new BigNumber(4_400),
        gainedLimit: new BigNumber(5_400),
      },
      unwithdrawnReward: new BigNumber(12),
      lastWithdrawnRewardDate: new Date("2026-01-01T00:00:00.000Z"),
      lastVotedDate: undefined,
    };

    it("reports an address TronGrid does not know as not activated, without resources", async () => {
      mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());

      const info = (await getAccountInfo(mockLogger, mockConfig, "TXYZ")) as TronAccountInfo;

      expect(mockFetchTronAccount).toHaveBeenCalledWith(mockLogger, mockConfig, "TXYZ");
      expect(mockFetchTronResources).not.toHaveBeenCalled();
      expect(info.activated).toBe(false);
      expect(info).not.toHaveProperty("resources");
    });

    it("reports an activated account with its resources in their JSON form", async () => {
      mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValueOnce([account]);
      mockFetchTronResources.mockResolvedValueOnce(resources);

      const info = (await getAccountInfo(mockLogger, mockConfig, "TXYZ")) as TronAccountInfo;

      expect(mockFetchTronResources).toHaveBeenCalledWith(mockLogger, mockConfig, account);
      expect(info).toEqual({
        type: "tron",
        energyLimit: 0,
        energy: 0,
        bandwidth: 0,
        activated: true,
        resources: {
          frozen: { bandwidth: { amount: "1000000" }, energy: undefined },
          unFrozen: {
            bandwidth: [{ amount: "2000000", expireTime: "2026-01-02T00:00:00.000Z" }],
            energy: undefined,
          },
          delegatedFrozen: { bandwidth: undefined, energy: { amount: "3000000" } },
          legacyFrozen: { bandwidth: undefined, energy: undefined },
          votes: [{ name: "Ledger", address: "TLedger", voteCount: 4 }],
          tronPower: 6,
          energy: "42000",
          bandwidth: {
            freeUsed: "100",
            freeLimit: "600",
            gainedUsed: "4400",
            gainedLimit: "5400",
          },
          unwithdrawnReward: "12",
          lastWithdrawnRewardDate: "2026-01-01T00:00:00.000Z",
          lastVotedDate: undefined,
        },
      });
    });

    it.each([
      ["not activated", []],
      ["activated", [account]],
    ])("answers a JSON-safe value when %s", async (_, accounts) => {
      mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValueOnce(accounts);
      mockFetchTronResources.mockResolvedValueOnce(resources);

      const info = await getAccountInfo(mockLogger, mockConfig, "TXYZ");

      expect(JSON.parse(JSON.stringify(info))).toEqual(info);
    });

    it("fails when the account read fails, rather than reporting it as not activated", async () => {
      mockGetTronAccountNetwork.mockResolvedValueOnce(buildNetworkInfo());
      mockFetchTronAccount.mockRejectedValueOnce(new Error("TronGrid down"));

      await expect(getAccountInfo(mockLogger, mockConfig, "TXYZ")).rejects.toThrow("TronGrid down");
    });
  });
});
