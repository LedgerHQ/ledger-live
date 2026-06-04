import { ethers } from "ethers";
import network from "@ledgerhq/live-network";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import monadAbi from "../../abis/monad.abi.json";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { clearValidatorsCache, getValidators } from "./index";
import { fetchMonadStakes, getValidatorAddressById } from "./monad";

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
jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedGetCoinConfig = jest.mocked(getCoinConfig);
const mockedWithApi = jest.mocked(withApi);
const mockedGetCryptoCurrencyById = jest.mocked(getCryptoCurrencyById);
const mockedNetwork = jest.mocked(network);

const monadIface = new ethers.Interface(monadAbi);
const PRECOMPILE = "0x0000000000000000000000000000000000001000";

const encodeExecValSet = (isDone: boolean, nextIndex: number, valIds: bigint[]): string =>
  monadIface.encodeFunctionResult("getExecutionValidatorSet", [isDone, nextIndex, valIds]);

const encodeGetValidator = (params: {
  stake: bigint;
  commission: bigint;
  secpPubkey?: string;
}): string =>
  monadIface.encodeFunctionResult("getValidator", [
    "0x0000000000000000000000000000000000000000", // authAddress (operator account, not the validator address)
    0n, // flags
    params.stake,
    0n, // accRewardPerToken
    params.commission,
    0n, // unclaimedRewards
    0n, // consensusStake
    0n, // consensusCommission
    0n, // snapshotStake
    0n, // snapshotCommission
    params.secpPubkey ?? "0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187",
    "0x",
  ]);

type CallHandler = (request: { to?: string; data?: string }) => Promise<string>;

const setupRpc = (handler: CallHandler) => {
  mockedGetCoinConfig.mockReturnValue({
    info: { node: { type: "external", uri: "https://monad.rpc/" } },
  } as unknown as ReturnType<typeof getCoinConfig>);
  mockedGetCryptoCurrencyById.mockReturnValue({
    id: "monad",
    name: "Monad",
    units: [{ name: "MON", code: "MON", magnitude: 18 }],
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
  getDelegations?: (startValId: bigint) => string | Error;
  getDelegator?: (valId: bigint) => string | Error;
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
    if (desc.name === "getDelegations") {
      const startValId = desc.args[1] as bigint;
      const out = responses.getDelegations?.(startValId);
      if (out instanceof Error) throw out;
      if (!out) throw new Error(`no response for getDelegations(${startValId})`);
      return out;
    }
    if (desc.name === "getDelegator") {
      const valId = desc.args[0] as bigint;
      const out = responses.getDelegator?.(valId);
      if (out instanceof Error) throw out;
      if (!out) throw new Error(`no response for getDelegator(${valId})`);
      return out;
    }
    throw new Error(`unexpected function: ${desc.name}`);
  };
};

describe("staking/validators/monad", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearValidatorsCache();
  });

  it("fetches and maps a single page of validators from the precompile", async () => {
    const valDetails: Record<string, { stake: bigint; commission: bigint; secpPubkey: string }> = {
      "1": { stake: 1_000n, commission: 10n ** 17n, secpPubkey: "0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187" }, // 10%
      "2": { stake: 500n, commission: 5n * 10n ** 16n, secpPubkey: "0x0316e0861acf92dc4c0e357f73fe07263a87b65513a4b73750ab9194f9a39a6a54" }, // 5%
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
          validatorAddress: ethers.computeAddress("0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187"),
          validatorId: "1",
          name: "Validator 1",
          commission: 0.1,
          tokens: "1000",
          votingPower: 0,
          estimatedYearlyRewardsRate: 0,
        },
        {
          validatorAddress: ethers.computeAddress("0x0316e0861acf92dc4c0e357f73fe07263a87b65513a4b73750ab9194f9a39a6a54"),
          validatorId: "2",
          name: "Validator 2",
          commission: 0.05,
          tokens: "500",
          votingPower: 1,
          estimatedYearlyRewardsRate: 0,
        },
      ],
      next: undefined,
    });
    expect(callMock.mock.calls.every(([req]) => req.to === PRECOMPILE)).toBe(true);

    // a non-empty page is cached: the second read makes no further RPC calls
    const callsAfterFirst = callMock.mock.calls.length;
    await getValidators("monad");
    expect(callMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("enriches the validator name from the validator-info overlay (keyed by secp pubkey)", async () => {
    setupRpc(
      routeByName({
        getExecutionValidatorSet: () => encodeExecValSet(true, 0, [1n]),
        getValidator: () => encodeGetValidator({ stake: 1_000n, commission: 0n, secpPubkey: "0x03e773631152aa98da046d945f0d410d85369e19764a7f9de77fcb896defe527df" }),
      }),
    );
    // Repo filename is the lowercase secp hex without the `0x` prefix.
    mockedNetwork.mockResolvedValueOnce({
      data: { name: "GalaxyDigital" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const page = await getValidators("monad");

    expect(page.items[0]).toMatchObject({
      validatorAddress: ethers.computeAddress("0x03e773631152aa98da046d945f0d410d85369e19764a7f9de77fcb896defe527df"),
      name: "GalaxyDigital",
    });
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(
          "03e773631152aa98da046d945f0d410d85369e19764a7f9de77fcb896defe527df.json",
        ),
      }),
    );
  });

  it("returns the surviving validators when one getValidator call fails", async () => {
    setupRpc(
      routeByName({
        getExecutionValidatorSet: () => encodeExecValSet(true, 0, [1n, 2n]),
        getValidator: valId =>
          valId === 1n
            ? new Error("rpc timeout")
            : encodeGetValidator({ stake: 42n, commission: 0n, secpPubkey: "0x0316e0861acf92dc4c0e357f73fe07263a87b65513a4b73750ab9194f9a39a6a54" }),
      }),
    );

    const page = await getValidators("monad");

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      validatorAddress: ethers.computeAddress("0x0316e0861acf92dc4c0e357f73fe07263a87b65513a4b73750ab9194f9a39a6a54"),
      name: "Validator 2",
      tokens: "42",
    });
  });

  it("returns an empty page and does not cache when the validator set is empty", async () => {
    const callMock = setupRpc(
      routeByName({
        getExecutionValidatorSet: () => encodeExecValSet(true, 0, []),
      }),
    );

    const page = await getValidators("monad");

    expect(page.items).toStrictEqual([]);
    expect(page.next).toBeUndefined();

    // empty results are not cached, so the next read hits the precompile again
    const callsAfterFirst = callMock.mock.calls.length;
    await getValidators("monad");
    expect(callMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
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
          getValidator: () => encodeGetValidator({ stake: 1n, commission: 0n }),
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
          getValidator: () => encodeGetValidator({ stake: 1n, commission: 0n }),
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
          getValidator: () => encodeGetValidator({ stake: 1n, commission: 0n }),
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
          getValidator: () => encodeGetValidator({ stake: 1n, commission: 0n }),
        }),
      );

      await getValidators("monad");
      const callCountAfterFirst = callMock.mock.calls.length;

      const second = await getValidators("monad");
      expect(second.items).toHaveLength(1);
      expect(callMock.mock.calls.length).toBe(callCountAfterFirst);
    });

    it("caches each cursor independently", async () => {
      const callMock = setupRpc(
        routeByName({
          getExecutionValidatorSet: startIndex =>
            startIndex === 0n
              ? encodeExecValSet(false, 100, [1n])
              : encodeExecValSet(true, 0, [2n]),
          getValidator: () => encodeGetValidator({ stake: 1n, commission: 0n }),
        }),
      );

      const firstPage = await getValidators("monad");
      const secondPage = await getValidators("monad", "100");
      const callsAfterBoth = callMock.mock.calls.length;

      expect(firstPage).toStrictEqual({
        items: [
          {
            validatorAddress: ethers.computeAddress("0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187"),
            validatorId: "1",
            name: "Validator 1",
            commission: 0,
            tokens: "1",
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: "100",
      });
      expect(secondPage.next).toBeUndefined();

      // both cursors are now cached independently — no further RPC calls
      expect(await getValidators("monad")).toStrictEqual(firstPage);
      expect(await getValidators("monad", "100")).toStrictEqual(secondPage);
      expect(callMock.mock.calls.length).toBe(callsAfterBoth);
    });

    it("clearValidatorsCache(currencyId) drops every cached cursor for that currency", async () => {
      const callMock = setupRpc(
        routeByName({
          getExecutionValidatorSet: startIndex =>
            startIndex === 0n
              ? encodeExecValSet(false, 100, [1n])
              : encodeExecValSet(true, 0, [2n]),
          getValidator: () => encodeGetValidator({ stake: 1n, commission: 0n }),
        }),
      );

      await getValidators("monad");
      await getValidators("monad", "100");
      const callsBeforeClear = callMock.mock.calls.length;

      clearValidatorsCache("monad");

      // every cursor was evicted, so both reads hit the precompile again
      await getValidators("monad");
      await getValidators("monad", "100");
      expect(callMock.mock.calls.length).toBeGreaterThan(callsBeforeClear);
    });
  });

  describe("getValidatorAddressById", () => {
    it("resolves a validator id to its computed display address", async () => {
      setupRpc(
        routeByName({
          getValidator: () =>
            encodeGetValidator({
              stake: 0n,
              commission: 0n,
              secpPubkey:
                "0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187",
            }),
        }),
      );

      expect(await getValidatorAddressById("monad", 7n)).toEqual(
        ethers.computeAddress("0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187"),
      );
    });

    it("returns null when the node config is not external", async () => {
      mockedGetCoinConfig.mockReturnValue({
        info: { node: { type: "ledger" } },
      } as unknown as ReturnType<typeof getCoinConfig>);

      expect(await getValidatorAddressById("monad", 7n)).toBeNull();
    });

    it("returns null when the getValidator call fails", async () => {
      setupRpc(routeByName({ getValidator: () => new Error("boom") }));

      expect(await getValidatorAddressById("monad", 7n)).toBeNull();
    });
  });

  describe("fetchMonadStakes", () => {
    const DELEGATOR = "0x00000000000000000000000000000000000000aa";
    const SECP = "0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187";

    const fetchStakes = () =>
      fetchMonadStakes(DELEGATOR, {} as never, { id: "monad" } as never);

    const encodeDelegator = (
      stake: bigint,
      deltaStake = 0n,
      nextDeltaStake = 0n,
    ): string =>
      monadIface.encodeFunctionResult("getDelegator", [
        stake,
        0n,
        0n,
        deltaStake,
        nextDeltaStake,
        0n,
        0n,
      ]);

    const callNames = (callMock: ReturnType<typeof setupRpc>): (string | undefined)[] =>
      callMock.mock.calls.map(([req]) => monadIface.parseTransaction({ data: req.data ?? "0x" })?.name);

    it("returns one active stake for a single delegation", async () => {
      setupRpc(
        routeByName({
          getDelegations: () => monadIface.encodeFunctionResult("getDelegations", [true, 0, [7n]]),
          getDelegator: () => encodeDelegator(100n),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n, secpPubkey: SECP }),
        }),
      );

      expect(await fetchStakes()).toStrictEqual([
        {
          uid: `${PRECOMPILE}-7-${DELEGATOR}-active`,
          address: DELEGATOR,
          delegate: ethers.computeAddress(SECP),
          state: "active",
          asset: {
            type: "native",
            name: "Monad",
            unit: { name: "MON", code: "MON", magnitude: 18 },
          },
          amount: 100n,
          actions: [],
          details: {
            contractAddress: PRECOMPILE,
            validator: ethers.computeAddress(SECP),
            validatorId: "7",
          },
        },
      ]);
    });

    it("paginates getDelegations until isDone", async () => {
      setupRpc(
        routeByName({
          getDelegations: startValId =>
            startValId === 0n
              ? monadIface.encodeFunctionResult("getDelegations", [false, 5, [1n, 2n]])
              : monadIface.encodeFunctionResult("getDelegations", [true, 0, [3n]]),
          getDelegator: () => encodeDelegator(10n),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n }),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes.map(s => s.details?.validatorId)).toStrictEqual(["1", "2", "3"]);
    });

    it("splits a delegation into an active stake and an activating stake summing the deltas", async () => {
      setupRpc(
        routeByName({
          getDelegations: () => monadIface.encodeFunctionResult("getDelegations", [true, 0, [1n]]),
          getDelegator: () => encodeDelegator(100n, 50n, 25n),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n, secpPubkey: SECP }),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes.map(s => ({ uid: s.uid, state: s.state, amount: s.amount }))).toStrictEqual([
        { uid: `${PRECOMPILE}-1-${DELEGATOR}-active`, state: "active", amount: 100n },
        { uid: `${PRECOMPILE}-1-${DELEGATOR}-activating`, state: "activating", amount: 75n },
      ]);
    });

    it("returns only an activating stake when the active stake is zero", async () => {
      setupRpc(
        routeByName({
          getDelegations: () => monadIface.encodeFunctionResult("getDelegations", [true, 0, [1n]]),
          getDelegator: () => encodeDelegator(0n, 50n, 25n),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n, secpPubkey: SECP }),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes.map(s => ({ state: s.state, amount: s.amount }))).toStrictEqual([
        { state: "activating", amount: 75n },
      ]);
    });

    it("returns only an active stake when there are no pending deltas", async () => {
      setupRpc(
        routeByName({
          getDelegations: () => monadIface.encodeFunctionResult("getDelegations", [true, 0, [1n]]),
          getDelegator: () => encodeDelegator(100n),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n, secpPubkey: SECP }),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes.map(s => ({ state: s.state, amount: s.amount }))).toStrictEqual([
        { state: "active", amount: 100n },
      ]);
    });

    it("filters out delegations with a zero total amount", async () => {
      setupRpc(
        routeByName({
          getDelegations: () =>
            monadIface.encodeFunctionResult("getDelegations", [true, 0, [1n, 2n]]),
          getDelegator: valId => (valId === 1n ? encodeDelegator(0n) : encodeDelegator(42n)),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n }),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes.map(s => s.details?.validatorId)).toStrictEqual(["2"]);
    });

    it("returns surviving stakes when one getDelegator call fails", async () => {
      setupRpc(
        routeByName({
          getDelegations: () =>
            monadIface.encodeFunctionResult("getDelegations", [true, 0, [1n, 2n]]),
          getDelegator: valId =>
            valId === 1n ? new Error("rpc timeout") : encodeDelegator(42n),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n }),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes.map(s => s.details?.validatorId)).toStrictEqual(["2"]);
    });

    it("keeps the stake amount when getValidator fails for a delegated validator", async () => {
      setupRpc(
        routeByName({
          getDelegations: () => monadIface.encodeFunctionResult("getDelegations", [true, 0, [9n]]),
          getDelegator: () => encodeDelegator(77n),
          getValidator: () => new Error("boom"),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes).toHaveLength(1);
      expect(stakes[0]).toMatchObject({ amount: 77n, details: { validatorId: "9" } });
      expect(stakes[0].delegate).toBeUndefined();
    });

    it("returns an empty array and makes no detail calls without delegations", async () => {
      const callMock = setupRpc(
        routeByName({
          getDelegations: () => monadIface.encodeFunctionResult("getDelegations", [true, 0, []]),
        }),
      );

      expect(await fetchStakes()).toStrictEqual([]);
      expect(callNames(callMock)).toStrictEqual(["getDelegations"]);
    });

    it("returns an empty array when getDelegations reverts", async () => {
      setupRpc(routeByName({ getDelegations: () => new Error("missing revert data") }));

      expect(await fetchStakes()).toStrictEqual([]);
    });

    it("returns an empty array when the node config is not external", async () => {
      mockedGetCoinConfig.mockReturnValue({
        info: { node: { type: "ledger" } },
      } as unknown as ReturnType<typeof getCoinConfig>);

      expect(await fetchStakes()).toStrictEqual([]);
      expect(mockedWithApi).not.toHaveBeenCalled();
    });

    it("stops paginating when nextValId does not advance", async () => {
      const callMock = setupRpc(
        routeByName({
          getDelegations: () =>
            monadIface.encodeFunctionResult("getDelegations", [false, 0, [1n]]),
          getDelegator: () => encodeDelegator(5n),
          getValidator: () => encodeGetValidator({ stake: 0n, commission: 0n }),
        }),
      );

      const stakes = await fetchStakes();
      expect(stakes).toHaveLength(1);
      expect(callNames(callMock).filter(name => name === "getDelegations")).toHaveLength(1);
    });
  });
});
