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

    function makeCallHandler(getDelegationShares: bigint, convertToTokensAmount: bigint) {
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
        throw new Error(`unexpected call: ${desc?.name}`);
      });
    }

    function setupProvider(callHandler: ReturnType<typeof jest.fn>) {
      mockedWithApi.mockImplementation(async (_currency, fn) => fn({ call: callHandler } as never));
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
  });
});
