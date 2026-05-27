import { ethers } from "ethers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import monadAbi from "../../abis/monad.abi.json";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { clearValidatorsCache, getCachedValidators, getValidators } from "./index";

jest.mock("../../config", () => ({
  __esModule: true,
  getCoinConfig: jest.fn(),
}));
jest.mock("../../network/node/rpc.common", () => ({
  __esModule: true,
  withApi: jest.fn(),
}));
jest.mock("@ledgerhq/cryptoassets", () => ({
  __esModule: true,
  getCryptoCurrencyById: jest.fn(),
}));

const mockedGetCoinConfig = jest.mocked(getCoinConfig);
const mockedWithApi = jest.mocked(withApi);
const mockedGetCryptoCurrencyById = jest.mocked(getCryptoCurrencyById);

const monadIface = new ethers.Interface(monadAbi);
const PRECOMPILE = "0x0000000000000000000000000000000000001000";

const encodeExecValSet = (isDone: boolean, nextIndex: number, valIds: bigint[]): string =>
  monadIface.encodeFunctionResult("getExecutionValidatorSet", [isDone, nextIndex, valIds]);

const encodeGetValidator = (params: {
  authAddress: string;
  stake: bigint;
  commission: bigint;
}): string =>
  monadIface.encodeFunctionResult("getValidator", [
    params.authAddress,
    0n, // flags
    params.stake,
    0n, // accRewardPerToken
    params.commission,
    0n, // unclaimedRewards
    0n, // consensusStake
    0n, // consensusCommission
    0n, // snapshotStake
    0n, // snapshotCommission
    "0x",
    "0x",
  ]);

type CallHandler = (request: { to?: string; data?: string }) => Promise<string>;

const setupRpc = (handler: CallHandler) => {
  mockedGetCoinConfig.mockReturnValue({
    info: { node: { type: "external", uri: "https://monad.rpc/" } },
  } as unknown as ReturnType<typeof getCoinConfig>);
  mockedGetCryptoCurrencyById.mockReturnValue({
    id: "monad",
  } as unknown as ReturnType<typeof getCryptoCurrencyById>);
  const callMock = jest.fn(handler);
  mockedWithApi.mockImplementation(async (_currency, fn) =>
    fn({ call: callMock } as unknown as Parameters<typeof fn>[0]),
  );
  return callMock;
};

/**
 * Routes provider.call() by function name decoded from the 4-byte selector so
 * each test declares per-function responses instead of an ordered byte stream.
 */
const routeByName = (responses: {
  getExecutionValidatorSet?: (startIndex: bigint) => string | Error;
  getValidator?: (valId: bigint) => string | Error;
}): CallHandler => {
  return async ({ data }) => {
    if (!data) throw new Error("missing data");
    const desc = monadIface.parseTransaction({ data });
    if (!desc) throw new Error("could not parse calldata");
    if (desc.name === "getExecutionValidatorSet") {
      const startIndex = desc.args[0] as bigint;
      const out = responses.getExecutionValidatorSet?.(startIndex);
      if (out instanceof Error) throw out;
      if (!out) throw new Error(`no response for getExecutionValidatorSet(${startIndex})`);
      return out;
    }
    if (desc.name === "getValidator") {
      const valId = desc.args[0] as bigint;
      const out = responses.getValidator?.(valId);
      if (out instanceof Error) throw out;
      if (!out) throw new Error(`no response for getValidator(${valId})`);
      return out;
    }
    throw new Error(`unexpected function: ${desc.name}`);
  };
};

describe("staking/validators/monad", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearValidatorsCache();
    expect(getCachedValidators("monad")).toBeUndefined();
  });

  it("fetches and maps a single page of validators from the precompile", async () => {
    const valDetails: Record<string, { authAddress: string; stake: bigint; commission: bigint }> =
      {
        "1": {
          authAddress: "0x1111111111111111111111111111111111111111",
          stake: 1_000n,
          commission: 10n ** 17n, // 10%
        },
        "2": {
          authAddress: "0x2222222222222222222222222222222222222222",
          stake: 500n,
          commission: 5n * 10n ** 16n, // 5%
        },
      };

    const callMock = setupRpc(
      routeByName({
        getExecutionValidatorSet: () => encodeExecValSet(true, 0, [1n, 2n]),
        getValidator: valId => encodeGetValidator(valDetails[valId.toString()]),
      }),
    );

    expect(await getValidators("monad")).toStrictEqual({
      items: [
        {
          validatorAddress: "0x1111111111111111111111111111111111111111",
          name: "Validator 1",
          commission: 0.1,
          tokens: 1_000,
          votingPower: 0,
          estimatedYearlyRewardsRate: 0,
        },
        {
          validatorAddress: "0x2222222222222222222222222222222222222222",
          name: "Validator 2",
          commission: 0.05,
          tokens: 500,
          votingPower: 1,
          estimatedYearlyRewardsRate: 0,
        },
      ],
      next: undefined,
    });
    expect(callMock.mock.calls.every(([req]) => req.to === PRECOMPILE)).toBe(true);
    expect(getCachedValidators("monad")).toStrictEqual({
      items: [
        {
          validatorAddress: "0x1111111111111111111111111111111111111111",
          name: "Validator 1",
          commission: 0.1,
          tokens: 1_000,
          votingPower: 0,
          estimatedYearlyRewardsRate: 0,
        },
        {
          validatorAddress: "0x2222222222222222222222222222222222222222",
          name: "Validator 2",
          commission: 0.05,
          tokens: 500,
          votingPower: 1,
          estimatedYearlyRewardsRate: 0,
        },
      ],
      next: undefined,
    });
  });

  it("returns the surviving validators when one getValidator call fails", async () => {
    setupRpc(
      routeByName({
        getExecutionValidatorSet: () => encodeExecValSet(true, 0, [1n, 2n]),
        getValidator: valId =>
          valId === 1n
            ? new Error("rpc timeout")
            : encodeGetValidator({
                authAddress: "0x2222222222222222222222222222222222222222",
                stake: 42n,
                commission: 0n,
              }),
      }),
    );

    const page = await getValidators("monad");

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      validatorAddress: "0x2222222222222222222222222222222222222222",
      name: "Validator 2",
      tokens: 42,
    });
  });

  it("returns an empty page and does not cache when the validator set is empty", async () => {
    setupRpc(
      routeByName({
        getExecutionValidatorSet: () => encodeExecValSet(true, 0, []),
      }),
    );

    const page = await getValidators("monad");

    expect(page.items).toStrictEqual([]);
    expect(page.next).toBeUndefined();
    expect(getCachedValidators("monad")).toBeUndefined();
  });

  it("returns an empty page when the node config is not external", async () => {
    mockedGetCoinConfig.mockReturnValue({
      info: { node: { type: "ledger" } },
    } as unknown as ReturnType<typeof getCoinConfig>);

    const page = await getValidators("monad");

    expect(page.items).toStrictEqual([]);
    expect(page.next).toBeUndefined();
    expect(mockedWithApi).not.toHaveBeenCalled();
  });

  describe("pagination", () => {
    it("returns a page with next set when isDone=false", async () => {
      setupRpc(
        routeByName({
          getExecutionValidatorSet: () => encodeExecValSet(false, 100, [1n, 2n]),
          getValidator: valId =>
            encodeGetValidator({
              authAddress: `0x${valId.toString().padStart(40, "0")}`,
              stake: 1n,
              commission: 0n,
            }),
        }),
      );

      const page = await getValidators("monad");

      expect(page.items).toHaveLength(2);
      expect(page.next).toBe("100");
    });

    it("advances pagination when called with the previous next cursor", async () => {
      setupRpc(
        routeByName({
          getExecutionValidatorSet: startIndex =>
            startIndex === 0n
              ? encodeExecValSet(false, 100, [1n, 2n])
              : encodeExecValSet(true, 0, [3n]),
          getValidator: valId =>
            encodeGetValidator({
              authAddress: `0x${valId.toString().padStart(40, "0")}`,
              stake: 1n,
              commission: 0n,
            }),
        }),
      );

      const first = await getValidators("monad");
      expect(first.next).toBe("100");

      const second = await getValidators("monad", first.next);
      expect(second.items).toHaveLength(1);
      expect(second.next).toBeUndefined();
    });

    it.each([
      ["isDone=true", encodeExecValSet(true, 0, [1n])],
      ["pageIds empty", encodeExecValSet(false, 100, [])],
      ["nextIndex <= startIndex", encodeExecValSet(false, 0, [1n])],
    ])("returns next=undefined when %s", async (_label, raw) => {
      setupRpc(
        routeByName({
          getExecutionValidatorSet: () => raw,
          getValidator: valId =>
            encodeGetValidator({
              authAddress: `0x${valId.toString().padStart(40, "0")}`,
              stake: 1n,
              commission: 0n,
            }),
        }),
      );

      const page = await getValidators("monad");

      expect(page.next).toBeUndefined();
    });
  });

  describe("caching", () => {
    it("serves cached items on the second call for the same cursor", async () => {
      const callMock = setupRpc(
        routeByName({
          getExecutionValidatorSet: () => encodeExecValSet(true, 0, [1n]),
          getValidator: () =>
            encodeGetValidator({
              authAddress: "0x1111111111111111111111111111111111111111",
              stake: 1n,
              commission: 0n,
            }),
        }),
      );

      await getValidators("monad");
      const callCountAfterFirst = callMock.mock.calls.length;

      const second = await getValidators("monad");
      expect(second.items).toHaveLength(1);
      expect(callMock.mock.calls.length).toBe(callCountAfterFirst);
    });

    it("caches each cursor independently", async () => {
      setupRpc(
        routeByName({
          getExecutionValidatorSet: startIndex =>
            startIndex === 0n
              ? encodeExecValSet(false, 100, [1n])
              : encodeExecValSet(true, 0, [2n]),
          getValidator: valId =>
            encodeGetValidator({
              authAddress: `0x${valId.toString().padStart(40, "0")}`,
              stake: 1n,
              commission: 0n,
            }),
        }),
      );

      await getValidators("monad");
      await getValidators("monad", "100");

      expect(getCachedValidators("monad")).toStrictEqual({
        items: [
          {
            validatorAddress: `0x${"1".padStart(40, "0")}`,
            name: "Validator 1",
            commission: 0,
            tokens: 1,
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: "100",
      });
      expect(getCachedValidators("monad", "100")).toStrictEqual({
        items: [
          {
            validatorAddress: `0x${"2".padStart(40, "0")}`,
            name: "Validator 2",
            commission: 0,
            tokens: 1,
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: undefined,
      });
    });

    it("clearValidatorsCache(currencyId) drops every cached cursor for that currency", async () => {
      setupRpc(
        routeByName({
          getExecutionValidatorSet: startIndex =>
            startIndex === 0n
              ? encodeExecValSet(false, 100, [1n])
              : encodeExecValSet(true, 0, [2n]),
          getValidator: valId =>
            encodeGetValidator({
              authAddress: `0x${valId.toString().padStart(40, "0")}`,
              stake: 1n,
              commission: 0n,
            }),
        }),
      );

      await getValidators("monad");
      await getValidators("monad", "100");
      expect(getCachedValidators("monad")).toStrictEqual({
        items: [
          {
            validatorAddress: `0x${"1".padStart(40, "0")}`,
            name: "Validator 1",
            commission: 0,
            tokens: 1,
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: "100",
      });
      expect(getCachedValidators("monad", "100")).toStrictEqual({
        items: [
          {
            validatorAddress: `0x${"2".padStart(40, "0")}`,
            name: "Validator 2",
            commission: 0,
            tokens: 1,
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: undefined,
      });

      clearValidatorsCache("monad");

      expect(getCachedValidators("monad")).toBeUndefined();
      expect(getCachedValidators("monad", "100")).toBeUndefined();
    });
  });
});
