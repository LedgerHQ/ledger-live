import { ethers } from "ethers";
import network from "@ledgerhq/live-network";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { isExternalNodeConfig } from "../../network/node/types";
import zeroGravityAbi from "../../abis/zero_gravity-validator.abi.json";
import { clearValidatorsCache, getValidators } from "./index";
import { fetchZeroGravityStakes } from "./zero_gravity";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../config", () => ({ __esModule: true, getCoinConfig: jest.fn() }));
jest.mock("../../network/node/rpc.common", () => ({ __esModule: true, withApi: jest.fn() }));
jest.mock("../../network/node/types", () => ({
  __esModule: true,
  isExternalNodeConfig: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const mockedGetCoinConfig = jest.mocked(getCoinConfig);
const mockedWithApi = jest.mocked(withApi);
const mockedIsExternalNodeConfig = jest.mocked(isExternalNodeConfig);

const makeValidator = (
  overrides: Partial<{
    addr: string;
    moniker: string | null;
    commission_pct: string;
    voting_power_tokens: string;
  }> = {},
) => ({
  addr: "aabbccddee" + "00".repeat(15),
  moniker: "TestValidator",
  commission_pct: "5.00",
  voting_power_tokens: "1000000000000000000",
  ...overrides,
});

describe("staking/validators/zero_gravity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearValidatorsCache("zero_gravity");
  });

  it("maps addr to validatorAddress with 0x prefix", async () => {
    const addr = "aabbccddee" + "00".repeat(15);
    mockedNetwork.mockResolvedValueOnce({ data: [makeValidator({ addr })] } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].validatorAddress).toEqual(ethers.getAddress("0x" + addr));
  });

  it("uses moniker as name", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ moniker: "MyNode" })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].name).toEqual("MyNode");
  });

  it("falls back to 0x+addr when moniker is null", async () => {
    const addr = "aabbccddee" + "00".repeat(15);
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ addr, moniker: null })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].name).toEqual(ethers.getAddress("0x" + addr));
  });

  it("converts commission_pct string to a decimal fraction", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ commission_pct: "5.00" })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].commission).toEqual(0.05);
  });

  it("maps voting_power_tokens to tokens", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ voting_power_tokens: "42000000000000000000" })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].tokens).toEqual("42000000000000000000");
  });

  it("assigns votingPower from position index", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator(), makeValidator({ addr: "ff" + "00".repeat(19) })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].votingPower).toEqual(0);
    expect(page.items[1].votingPower).toEqual(1);
  });

  it("returns empty page on network error", async () => {
    mockedNetwork.mockRejectedValueOnce(new Error("network failure"));

    const page = await getValidators("zero_gravity");

    expect(page).toEqual({ items: [], next: undefined });
  });

  it("always returns next: undefined (single-page API)", async () => {
    mockedNetwork.mockResolvedValueOnce({ data: [makeValidator()] } as never);

    const page = await getValidators("zero_gravity");

    expect(page.next).toBeUndefined();
  });

  describe("fetchZeroGravityStakes", () => {
    const CURRENCY = {
      id: "zero_gravity",
      name: "0G",
      units: [{ magnitude: 18, name: "A0GI", code: "A0GI" }],
    } as never;
    const DELEGATOR = "0x" + "11".repeat(20);
    const VALIDATOR_ADDR = ethers.getAddress("0xaabbccddee" + "00".repeat(15));
    const NODE = { type: "external", uri: "https://zero-gravity.coin.ledger.com" };
    const zg0Iface = new ethers.Interface(zeroGravityAbi as ethers.InterfaceAbi);

    const CURRENT_BLOCK = 1_000_000n;

    function makeCallHandler(
      getDelegationShares: bigint,
      convertToTokensAmount: bigint,
      withdrawCount = 0n,
      withdrawEntries: Array<[bigint, string, bigint]> = [],
      totalPendingRewards = 0n,
      totalDelegatorShares = 0n,
      commissionPpm = 0n,
    ) {
      return jest.fn(async ({ data }: { data?: string }) => {
        const desc = zg0Iface.parseTransaction({ data: data ?? "0x" });
        if (desc?.name === "getDelegation") {
          return zg0Iface.encodeFunctionResult("getDelegation", [
            "0x0000000000000000000000000000000000000000",
            getDelegationShares,
          ]);
        }
        if (desc?.name === "convertToTokens") {
          return zg0Iface.encodeFunctionResult("convertToTokens", [convertToTokensAmount]);
        }
        if (desc?.name === "withdrawCount") {
          return zg0Iface.encodeFunctionResult("withdrawCount", [withdrawCount]);
        }
        if (desc?.name === "getWithdraw") {
          const index = Number(desc.args[0]);
          const entry = withdrawEntries[index];
          if (!entry) throw new Error(`no withdraw entry at index ${index}`);
          return zg0Iface.encodeFunctionResult("getWithdraw", entry);
        }
        if (desc?.name === "rewards") {
          return zg0Iface.encodeFunctionResult("rewards", [totalPendingRewards]);
        }
        if (desc?.name === "delegatorShares") {
          return zg0Iface.encodeFunctionResult("delegatorShares", [totalDelegatorShares]);
        }
        if (desc?.name === "commissionRate") {
          return zg0Iface.encodeFunctionResult("commissionRate", [commissionPpm]);
        }
        throw new Error(`unexpected call: ${desc?.name}`);
      });
    }

    function setupProvider(callHandler: ReturnType<typeof jest.fn>) {
      mockedWithApi.mockImplementation(async (_currency, fn) =>
        fn({
          call: callHandler,
          getBlockNumber: jest.fn().mockResolvedValue(Number(CURRENT_BLOCK)),
        } as never),
      );
    }

    beforeEach(() => {
      mockedGetCoinConfig.mockReturnValue({ info: { node: NODE } } as never);
      mockedIsExternalNodeConfig.mockReturnValue(true);
      mockedNetwork.mockResolvedValueOnce({ data: [makeValidator()] } as never);
    });

    it("returns an active stake when shares and amount are non-zero", async () => {
      setupProvider(makeCallHandler(1000n, 500n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes).toHaveLength(1);
      expect(stakes[0]).toMatchObject({
        delegate: VALIDATOR_ADDR,
        amount: 500n,
        state: "active",
      });
    });

    it("sets amountRewarded proportionally after commission deduction", async () => {
      // delegator holds 500 of 1000 total shares, 10% commission, 1000n total rewards
      // net = 1000 * (1_000_000 - 100_000) / 1_000_000 = 900
      // delegator share = 900 * 500 / 1000 = 450
      setupProvider(makeCallHandler(500n, 500n, 0n, [], 1000n, 1000n, 100_000n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes[0].amountRewarded).toEqual(450n);
    });

    it("does not set amountRewarded when rewards are zero", async () => {
      setupProvider(makeCallHandler(1000n, 500n, 0n, [], 0n, 1000n, 0n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes[0].amountRewarded).toBeUndefined();
    });

    it("does not set amountRewarded when totalShares is zero", async () => {
      setupProvider(makeCallHandler(1000n, 500n, 0n, [], 1000n, 0n, 0n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes[0].amountRewarded).toBeUndefined();
    });

    it("does not set amountRewarded when reward RPC calls fail", async () => {
      const callHandler = jest.fn(async ({ data }: { data?: string }) => {
        const desc = zg0Iface.parseTransaction({ data: data ?? "0x" });
        if (desc?.name === "getDelegation") {
          return zg0Iface.encodeFunctionResult("getDelegation", [
            "0x0000000000000000000000000000000000000000",
            1000n,
          ]);
        }
        if (desc?.name === "convertToTokens") {
          return zg0Iface.encodeFunctionResult("convertToTokens", [500n]);
        }
        if (desc?.name === "withdrawCount") {
          return zg0Iface.encodeFunctionResult("withdrawCount", [0n]);
        }
        throw new Error("RPC error");
      });
      setupProvider(callHandler);

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes[0].amountRewarded).toBeUndefined();
    });

    it("clamps commission to 1_000_000 when contract returns an out-of-range value", async () => {
      setupProvider(makeCallHandler(1000n, 500n, 0n, [], 1000n, 1000n, 1_500_000n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes[0].amountRewarded).toBeUndefined();
    });

    it("does not set amountRewarded when reward calls return empty data", async () => {
      const callHandler = jest.fn(async ({ data }: { data?: string }) => {
        const desc = zg0Iface.parseTransaction({ data: data ?? "0x" });
        if (desc?.name === "getDelegation") {
          return zg0Iface.encodeFunctionResult("getDelegation", [
            "0x0000000000000000000000000000000000000000",
            1000n,
          ]);
        }
        if (desc?.name === "convertToTokens") {
          return zg0Iface.encodeFunctionResult("convertToTokens", [500n]);
        }
        if (desc?.name === "withdrawCount") {
          return zg0Iface.encodeFunctionResult("withdrawCount", [0n]);
        }
        return "0x";
      });
      setupProvider(callHandler);

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes[0].amountRewarded).toBeUndefined();
    });

    it("filters out validators with shares = 0", async () => {
      setupProvider(makeCallHandler(0n, 0n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes).toEqual([]);
    });

    it("filters out validators when convertToTokens returns 0", async () => {
      setupProvider(makeCallHandler(1000n, 0n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes).toEqual([]);
    });

    it("handles a rejected getDelegation call without throwing", async () => {
      mockedWithApi.mockImplementation(async (_currency, fn) =>
        fn({ call: jest.fn().mockRejectedValue(new Error("RPC error")) } as never),
      );

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes).toEqual([]);
    });

    it("processes validators across batching boundaries (> 10)", async () => {
      const validators = Array.from({ length: 11 }, (_, i) => ({
        addr: `aabb${i.toString().padStart(2, "0")}` + "00".repeat(17),
        moniker: `Validator${i}`,
        commission_pct: "5.00",
        voting_power_tokens: "1000",
      }));
      mockedNetwork.mockReset();
      mockedNetwork.mockResolvedValueOnce({ data: validators } as never);
      setupProvider(makeCallHandler(1000n, 500n));

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes).toHaveLength(11);
    });

    it("returns [] when node config is not external", async () => {
      mockedIsExternalNodeConfig.mockReturnValue(false);

      const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

      expect(stakes).toEqual([]);
    });

    describe("unbondings", () => {
      const NOW = 1_000_000_000;
      const ASSET = {
        type: "native",
        name: "0G",
        unit: { magnitude: 18, name: "A0GI", code: "A0GI" },
      };

      beforeEach(() => {
        jest.useFakeTimers({ now: NOW });
      });
      afterEach(() => {
        jest.useRealTimers();
      });

      it("returns a deactivating stake when withdrawCount > 0 and delegator matches", async () => {
        const completionHeight = CURRENT_BLOCK + 100n;
        setupProvider(makeCallHandler(0n, 0n, 1n, [[completionHeight, DELEGATOR, 500n]]));

        const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

        expect(stakes).toEqual([
          {
            uid: `${VALIDATOR_ADDR}-${DELEGATOR}-unbonding-0`,
            address: DELEGATOR,
            delegate: VALIDATOR_ADDR,
            state: "deactivating",
            stateUpdatedAt: new Date(NOW + 100 * 1_000),
            asset: ASSET,
            amount: 500n,
            actions: [],
            details: { contractAddress: VALIDATOR_ADDR, validator: VALIDATOR_ADDR },
          },
        ]);
      });

      it("skips withdraw entries for other delegators", async () => {
        const otherDelegator = "0x" + "22".repeat(20);
        setupProvider(makeCallHandler(0n, 0n, 1n, [[CURRENT_BLOCK + 100n, otherDelegator, 500n]]));

        const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

        expect(stakes).toEqual([]);
      });

      it("skips withdraw entries with amount = 0", async () => {
        setupProvider(makeCallHandler(0n, 0n, 1n, [[CURRENT_BLOCK + 100n, DELEGATOR, 0n]]));

        const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

        expect(stakes).toEqual([]);
      });

      it("skips entries whose completionHeight has already passed", async () => {
        setupProvider(makeCallHandler(0n, 0n, 1n, [[CURRENT_BLOCK - 1n, DELEGATOR, 300n]]));

        const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

        expect(stakes).toEqual([]);
      });

      it("returns both active and deactivating stakes together", async () => {
        const completionHeight = CURRENT_BLOCK + 200n;
        setupProvider(makeCallHandler(1000n, 500n, 1n, [[completionHeight, DELEGATOR, 300n]]));

        const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

        expect(stakes).toEqual([
          {
            uid: `${VALIDATOR_ADDR}-${DELEGATOR}`,
            address: DELEGATOR,
            delegate: VALIDATOR_ADDR,
            state: "active",
            asset: ASSET,
            amount: 500n,
            actions: [],
            details: { contractAddress: VALIDATOR_ADDR, validator: VALIDATOR_ADDR, shares: 1000n },
          },
          {
            uid: `${VALIDATOR_ADDR}-${DELEGATOR}-unbonding-0`,
            address: DELEGATOR,
            delegate: VALIDATOR_ADDR,
            state: "deactivating",
            stateUpdatedAt: new Date(NOW + 200 * 1_000),
            asset: ASSET,
            amount: 300n,
            actions: [],
            details: { contractAddress: VALIDATOR_ADDR, validator: VALIDATOR_ADDR },
          },
        ]);
      });

      it("handles rejected getWithdraw without throwing", async () => {
        const callHandler = jest.fn(async ({ data }: { data?: string }) => {
          const desc = zg0Iface.parseTransaction({ data: data ?? "0x" });
          if (desc?.name === "getDelegation") {
            return zg0Iface.encodeFunctionResult("getDelegation", [
              "0x0000000000000000000000000000000000000000",
              0n,
            ]);
          }
          if (desc?.name === "convertToTokens") {
            return zg0Iface.encodeFunctionResult("convertToTokens", [0n]);
          }
          if (desc?.name === "withdrawCount") {
            return zg0Iface.encodeFunctionResult("withdrawCount", [1n]);
          }
          if (desc?.name === "getWithdraw") {
            throw new Error("RPC error on getWithdraw");
          }
          throw new Error(`unexpected call: ${desc?.name}`);
        });
        setupProvider(callHandler);

        const stakes = await fetchZeroGravityStakes(DELEGATOR, {} as never, CURRENCY);

        expect(stakes).toEqual([]);
      });
    });
  });
});
