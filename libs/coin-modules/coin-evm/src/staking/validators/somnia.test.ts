import { ethers } from "ethers";
import network from "@ledgerhq/live-network";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import somniaAbi from "../../abis/somnia.abi.json";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { clearValidatorsCache, getValidators } from "./index";
import { clearValidatorNamesCache, fetchSomniaStakes, fetchValidatorNames } from "./somnia";

jest.mock("../../config", () => ({ __esModule: true, getCoinConfig: jest.fn() }));
jest.mock("../../network/node/rpc.common", () => ({ __esModule: true, withApi: jest.fn() }));
jest.mock("@ledgerhq/ledger-wallet-framework/currencies", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/currencies"),
  getCryptoCurrencyById: jest.fn(),
}));
jest.mock("@ledgerhq/live-network", () => ({ __esModule: true, default: jest.fn() }));

const mockedGetCoinConfig = jest.mocked(getCoinConfig);
const mockedWithApi = jest.mocked(withApi);
const mockedGetCryptoCurrencyById = jest.mocked(getCryptoCurrencyById);
const mockedNetwork = jest.mocked(network);

const somniaIface = new ethers.Interface(somniaAbi);
const CONTRACT = "0xBe367d410D96E1cAeF68C0632251072CDf1b8250";
const VALIDATOR_A = ethers.getAddress("0x" + "aa".repeat(20));
const VALIDATOR_B = ethers.getAddress("0x" + "bb".repeat(20));
const DELEGATOR = ethers.getAddress("0x" + "cc".repeat(20));

type CallHandler = (request: { to?: string; data?: string }) => Promise<string>;

const setupRpc = (handler: CallHandler) => {
  mockedGetCoinConfig.mockReturnValue({
    info: { node: { type: "external", uri: "https://somnia-rpc.publicnode.com" } },
  } as unknown as ReturnType<typeof getCoinConfig>);
  mockedGetCryptoCurrencyById.mockReturnValue({
    id: "somnia",
    name: "Somnia",
    units: [{ name: "STT", code: "STT", magnitude: 18 }],
  } as unknown as ReturnType<typeof getCryptoCurrencyById>);
  const callMock = jest.fn(handler);
  mockedWithApi.mockImplementation(async (_currency, fn) =>
    fn({ call: callMock } as unknown as Parameters<typeof fn>[0]),
  );
  return callMock;
};

const encodeCommitteeValidators = (addresses: string[]): string =>
  somniaIface.encodeFunctionResult("getCommitteeValidators", [addresses]);

const encodeGetStake = (params: {
  address: string;
  stakedAmount: bigint;
  delegatedStake: bigint;
  delegateStakeRate: bigint;
}): string =>
  somniaIface.encodeFunctionResult("getStake", [
    [
      params.address,
      params.stakedAmount,
      0n,
      params.delegatedStake,
      params.delegateStakeRate,
      0n,
      0n,
      0n,
    ],
  ]);

const encodeGetDelegations = (addresses: string[]): string =>
  somniaIface.encodeFunctionResult("getDelegations", [addresses]);

const encodeGetDelegationInfo = (amount: bigint, pendingRewards: bigint): string =>
  somniaIface.encodeFunctionResult("getDelegationInfo", [amount, pendingRewards]);

const routeByName = (responses: {
  getCommitteeValidators?: () => string | Error;
  getStake?: (address: string) => string | Error;
  getDelegations?: () => string | Error;
  getDelegationInfo?: (validator: string) => string | Error;
}): CallHandler => {
  return async ({ data }) => {
    if (!data) throw new Error("missing data");
    const desc = somniaIface.parseTransaction({ data });
    if (!desc) throw new Error("could not parse calldata");

    if (desc.name === "getCommitteeValidators") {
      const out = responses.getCommitteeValidators?.();
      if (out instanceof Error) throw out;
      if (!out) throw new Error("no response for getCommitteeValidators");
      return out;
    }
    if (desc.name === "getStake") {
      const address = desc.args[0] as string;
      const out = responses.getStake?.(address);
      if (out instanceof Error) throw out;
      if (!out) throw new Error(`no response for getStake(${address})`);
      return out;
    }
    if (desc.name === "getDelegations") {
      const out = responses.getDelegations?.();
      if (out instanceof Error) throw out;
      if (!out) throw new Error("no response for getDelegations");
      return out;
    }
    if (desc.name === "getDelegationInfo") {
      const validator = desc.args[1] as string;
      const out = responses.getDelegationInfo?.(validator);
      if (out instanceof Error) throw out;
      if (!out) throw new Error(`no response for getDelegationInfo(${validator})`);
      return out;
    }
    throw new Error(`unexpected function: ${desc.name}`);
  };
};

describe("staking/validators/somnia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearValidatorsCache("somnia");
    clearValidatorNamesCache("somnia");
  });

  describe("fetchValidators", () => {
    it("returns committee validators with address as name and computed commission", async () => {
      setupRpc(
        routeByName({
          getCommitteeValidators: () => encodeCommitteeValidators([VALIDATOR_A, VALIDATOR_B]),
          getStake: address =>
            encodeGetStake({
              address,
              stakedAmount: 1000n,
              delegatedStake: 500n,
              delegateStakeRate: 9n * 10n ** 17n,
            }),
        }),
      );

      const page = await getValidators("somnia");

      expect(page.next).toBeUndefined();
      expect(page.items).toHaveLength(2);
      expect(page.items[0]).toMatchObject({
        validatorAddress: VALIDATOR_A,
        name: VALIDATOR_A,
        commission: expect.closeTo(0.1, 5),
        tokens: "1500",
        votingPower: 0,
        estimatedYearlyRewardsRate: 0,
      });
      expect(page.items[1]).toMatchObject({
        validatorAddress: VALIDATOR_B,
        votingPower: 1,
        tokens: "1500",
      });
    });

    it("skips a validator whose getStake call fails and keeps the rest", async () => {
      setupRpc(
        routeByName({
          getCommitteeValidators: () => encodeCommitteeValidators([VALIDATOR_A, VALIDATOR_B]),
          getStake: address =>
            address === VALIDATOR_A
              ? new Error("rpc timeout")
              : encodeGetStake({
                  address,
                  stakedAmount: 200n,
                  delegatedStake: 0n,
                  delegateStakeRate: 8n * 10n ** 17n,
                }),
        }),
      );

      const page = await getValidators("somnia");

      expect(page.items).toHaveLength(1);
      expect(page.items[0].validatorAddress).toBe(VALIDATOR_B);
    });

    it("returns empty when getCommitteeValidators returns no addresses", async () => {
      setupRpc(
        routeByName({
          getCommitteeValidators: () => encodeCommitteeValidators([]),
        }),
      );

      const page = await getValidators("somnia");

      expect(page.items).toStrictEqual([]);
      expect(page.next).toBeUndefined();
    });

    it("returns empty when the node config is not external", async () => {
      mockedGetCoinConfig.mockReturnValue({
        info: { node: { type: "ledger" } },
      } as unknown as ReturnType<typeof getCoinConfig>);

      const page = await getValidators("somnia");

      expect(page.items).toStrictEqual([]);
      expect(mockedWithApi).not.toHaveBeenCalled();
    });

    it("returns empty on getCommitteeValidators failure", async () => {
      setupRpc(routeByName({ getCommitteeValidators: () => new Error("network error") }));

      const page = await getValidators("somnia");

      expect(page.items).toStrictEqual([]);
    });
  });

  describe("fetchValidatorNames", () => {
    const mockNamesResponse = (data: unknown) =>
      mockedNetwork.mockResolvedValue({ data } as unknown as Awaited<ReturnType<typeof network>>);

    it("returns a lowercased address -> name map from a valid flat map", async () => {
      mockNamesResponse({
        [VALIDATOR_A]: "BitGo",
        [VALIDATOR_B.toLowerCase()]: "Kiln",
      });

      const names = await fetchValidatorNames("somnia");

      expect(names).toStrictEqual({
        [VALIDATOR_A.toLowerCase()]: "BitGo",
        [VALIDATOR_B.toLowerCase()]: "Kiln",
      });
    });

    it("drops non-address keys and trims names", async () => {
      mockNamesResponse({
        [VALIDATOR_A]: "  Everstake  ",
        "not-an-address": "Nope",
        "0x1234": "Too short",
      });

      const names = await fetchValidatorNames("somnia");

      expect(names).toStrictEqual({ [VALIDATOR_A.toLowerCase()]: "Everstake" });
    });

    it("drops entries whose name is empty, blank, or not a string", async () => {
      mockNamesResponse({
        [VALIDATOR_A]: "Everstake",
        "0x1111111111111111111111111111111111111111": "",
        "0x2222222222222222222222222222222222222222": "   ",
        "0x3333333333333333333333333333333333333333": 42,
        "0x4444444444444444444444444444444444444444": null,
      });

      const names = await fetchValidatorNames("somnia");

      expect(names).toStrictEqual({ [VALIDATOR_A.toLowerCase()]: "Everstake" });
    });

    it("returns {} for a JSON-RPC error/handshake blob (misconfigured baseUrl)", async () => {
      mockNamesResponse({
        jsonrpc: "2.0",
        id: "unknown",
        error: { code: -32600, message: "invalid request" },
      });

      const names = await fetchValidatorNames("somnia");

      expect(names).toStrictEqual({});
    });

    it("returns {} when the payload is an array", async () => {
      mockNamesResponse([{ addr: VALIDATOR_A, name: "BitGo" }]);

      const names = await fetchValidatorNames("somnia");

      expect(names).toStrictEqual({});
    });

    it("returns {} when the payload is null", async () => {
      mockNamesResponse(null);

      const names = await fetchValidatorNames("somnia");

      expect(names).toStrictEqual({});
    });

    it("rethrows on network error so makeLRUCache evicts (callers stay best-effort)", async () => {
      mockedNetwork.mockRejectedValue(new Error("network down"));

      await expect(fetchValidatorNames("somnia")).rejects.toThrow("network down");
    });
  });

  describe("fetchSomniaStakes", () => {
    const fetchStakes = () => fetchSomniaStakes(DELEGATOR, {} as never, { id: "somnia" } as never);

    const defaultStakeHandlers = (
      overrides: {
        delegationInfo?: (validator: string) => string | Error;
      } = {},
    ) =>
      routeByName({
        getDelegations: () => encodeGetDelegations([VALIDATOR_A]),
        getDelegationInfo: overrides.delegationInfo ?? (() => encodeGetDelegationInfo(100n, 0n)),
      });

    it("returns one active stake for a single delegation", async () => {
      setupRpc(defaultStakeHandlers());

      const stakes = await fetchStakes();

      expect(stakes).toHaveLength(1);
      expect(stakes[0]).toStrictEqual({
        uid: `${CONTRACT}-${VALIDATOR_A}-${DELEGATOR}`,
        address: DELEGATOR,
        delegate: VALIDATOR_A,
        state: "active",
        asset: {
          type: "native",
          name: "Somnia",
          unit: { name: "STT", code: "STT", magnitude: 18 },
        },
        amount: 100n,
        actions: [],
        details: { contractAddress: CONTRACT, validator: VALIDATOR_A },
      });
    });

    it("sets amountRewarded from getDelegationInfo pendingRewards", async () => {
      setupRpc(
        defaultStakeHandlers({
          delegationInfo: () => encodeGetDelegationInfo(100n, 42n),
        }),
      );

      const stakes = await fetchStakes();

      expect(stakes[0].amount).toBe(100n);
      expect(stakes[0].amountRewarded).toBe(42n);
    });

    it("keeps a delegation with amount=0 but pendingRewards > 0", async () => {
      setupRpc(
        defaultStakeHandlers({
          delegationInfo: () => encodeGetDelegationInfo(0n, 42n),
        }),
      );

      const stakes = await fetchStakes();

      expect(stakes).toHaveLength(1);
      expect(stakes[0].amount).toBe(0n);
      expect(stakes[0].amountRewarded).toBe(42n);
    });

    it("keeps the stake active (no per-delegation unstaking signal exists on Somnia)", async () => {
      setupRpc(defaultStakeHandlers());

      const stakes = await fetchStakes();

      expect(stakes).toHaveLength(1);
      expect(stakes[0].state).toBe("active");
      expect(stakes[0].stateUpdatedAt).toBeUndefined();
    });

    it("attaches the validator name from the names overlay to details.validatorName", async () => {
      mockedNetwork.mockResolvedValue({
        data: { [VALIDATOR_A.toLowerCase()]: "Everstake" },
      } as unknown as Awaited<ReturnType<typeof network>>);
      setupRpc(defaultStakeHandlers());

      const stakes = await fetchStakes();

      expect(stakes).toHaveLength(1);
      expect(stakes[0].details).toMatchObject({
        validator: VALIDATOR_A,
        validatorName: "Everstake",
      });
    });

    it("filters out delegations with zero amount and zero rewards", async () => {
      setupRpc(
        routeByName({
          getDelegations: () => encodeGetDelegations([VALIDATOR_A]),
          getDelegationInfo: () => encodeGetDelegationInfo(0n, 0n),
        }),
      );

      const stakes = await fetchStakes();

      expect(stakes).toStrictEqual([]);
    });

    it("returns empty when getDelegations returns an empty array", async () => {
      setupRpc(routeByName({ getDelegations: () => encodeGetDelegations([]) }));

      const stakes = await fetchStakes();

      expect(stakes).toStrictEqual([]);
    });

    it("returns surviving stakes when one per-validator fetch fails", async () => {
      setupRpc(
        routeByName({
          getDelegations: () => encodeGetDelegations([VALIDATOR_A, VALIDATOR_B]),
          getDelegationInfo: validator =>
            validator === VALIDATOR_A ? new Error("rpc timeout") : encodeGetDelegationInfo(50n, 0n),
        }),
      );

      const stakes = await fetchStakes();

      expect(stakes).toHaveLength(1);
      expect(stakes[0].delegate).toBe(VALIDATOR_B);
    });

    it("returns empty when the node config is not external", async () => {
      mockedGetCoinConfig.mockReturnValue({
        info: { node: { type: "ledger" } },
      } as unknown as ReturnType<typeof getCoinConfig>);

      const stakes = await fetchStakes();

      expect(stakes).toStrictEqual([]);
      expect(mockedWithApi).not.toHaveBeenCalled();
    });

    it("returns empty when getDelegations call throws", async () => {
      setupRpc(routeByName({ getDelegations: () => new Error("missing revert data") }));

      const stakes = await fetchStakes();

      expect(stakes).toStrictEqual([]);
    });

    it("processes delegations across batching boundaries (> 10 validators)", async () => {
      const validators = Array.from({ length: 11 }, (_, i) =>
        ethers.getAddress("0x" + i.toString().padStart(40, "0")),
      );
      setupRpc(
        routeByName({
          getDelegations: () => encodeGetDelegations(validators),
          getDelegationInfo: () => encodeGetDelegationInfo(10n, 0n),
        }),
      );

      const stakes = await fetchStakes();

      expect(stakes).toHaveLength(11);
    });
  });
});
