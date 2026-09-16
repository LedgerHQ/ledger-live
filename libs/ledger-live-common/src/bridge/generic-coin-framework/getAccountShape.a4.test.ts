import { log } from "@ledgerhq/logs";
import { A4HttpError } from "./a4/client/errors";
import { adaptA4OperationToLiveOperation } from "./a4/client/operations";
import { toA4Network } from "./a4/client/utils";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { genericGetAccountShape } from "./getAccountShape";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

jest.mock("@ledgerhq/logs");

const getSyncHashMock = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  encodeAccountId: jest.fn(() => "js:1:ethereum:0xabc:"),
  getSyncHash: (...args: any[]) => getSyncHashMock(...args),
}));

const mergeOpsMock = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  mergeOps: (...args: any[]) => mergeOpsMock(...args),
}));

const listOperationsMock = jest.fn();
const getBalanceMock = jest.fn();
const lastBlockMock = jest.fn();
const getAccountInfoMock = jest.fn();
jest.mock("./api", () => ({
  getCoinModuleApi: () => ({
    lastBlock: (...a: any[]) => lastBlockMock(...a),
    getBalance: (...a: any[]) => getBalanceMock(...a),
    listOperations: (...a: any[]) => listOperationsMock(...a),
    getAccountInfo: (...a: any[]) => getAccountInfoMock(...a),
  }),
}));

const getBridgeApiMock = jest.fn();
jest.mock("./bridge", () => ({
  getBridgeApi: (...a: any[]) => getBridgeApiMock(...a),
}));

const adaptCoreOperationToLiveOperationMock = jest.fn();
const extractBalanceMock = jest.fn();
const cleanedOperationMock = jest.fn();
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  adaptCoreOperationToLiveOperation: (...a: any[]) => adaptCoreOperationToLiveOperationMock(...a),
  extractBalance: (...a: any[]) => extractBalanceMock(...a),
  cleanedOperation: (...a: any[]) => cleanedOperationMock(...a),
}));

const getAccountRawAssignHooksMock = jest.fn(async () => ({}) as Record<string, unknown>);
jest.mock("./accountRawAssign", () => ({
  getAccountRawAssignHooks: (...a: any[]) => getAccountRawAssignHooksMock(...(a as [])),
}));

const inferSubOperationsMock = jest.fn();
const buildSubOperationIndexMock = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/serialization", () => ({
  inferSubOperations: (...a: any[]) => inferSubOperationsMock(...a),
  buildSubOperationIndex: (...a: any[]) => buildSubOperationIndexMock(...a),
}));

const buildSubAccountsMock = jest.fn();
const mergeSubAccountsMock = jest.fn();
jest.mock("./buildSubAccounts", () => ({
  buildSubAccounts: (...a: any[]) => buildSubAccountsMock(...a),
  mergeSubAccounts: (...a: any[]) => mergeSubAccountsMock(...a),
}));

// Prevents fire-and-forget ensureA4Registered from reaching the real A4 indexer
jest.mock("./a4/client/registration", () => ({
  ensureA4Registered: jest.fn(),
  clearA4RegistrationCache: jest.fn(),
}));

const resolveA4ChainConfigMock = jest.fn();
jest.mock("./a4/config", () => ({
  ...jest.requireActual("./a4/config"),
  resolveA4ChainConfig: (...a: any[]) => resolveA4ChainConfigMock(...a),
}));

const fetchA4OperationsMock = jest.fn();
jest.mock("./a4/client/operations", () => ({
  ...jest.requireActual("./a4/client/operations"),
  fetchA4Operations: (...a: any[]) => fetchA4OperationsMock(...a),
}));

// resolveA4BaseUrl calls getEnv() which would throw with no env vars in tests
const resolveA4BaseUrlMock = jest.fn();
jest.mock("./a4/client/utils", () => ({
  ...jest.requireActual("./a4/client/utils"),
  toA4Network: jest.fn().mockReturnValue("ethereum"),
  resolveA4BaseUrl: (...a: any[]) => resolveA4BaseUrlMock(...a),
}));

// The real A4Client opens HTTP connections; fetchA4Operations is mocked so the instance is never used
jest.mock("./a4/client/index", () => ({
  A4Client: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("./a4/client/accountId", () => ({
  deriveA4AccountId: jest.fn().mockReturnValue("a4-account-id"),
}));

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const currency = { id: "ethereum", name: "Ethereum" };
const network = "mainnet";

const defaultBridgeApi = () => ({
  getTokenFromAsset: jest.fn(),
  getChainSpecificRules: { getAccountShape: jest.fn() },
  refreshOperations: jest.fn(),
});

describe("genericGetAccountShape - A4 read branch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSyncHashMock.mockReturnValue("sync-hash");
    getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 0n, locked: 0n }]);
    extractBalanceMock.mockReturnValue({ value: 0n, locked: 0n });
    lastBlockMock.mockResolvedValue({ height: 0 });
    mergeOpsMock.mockImplementation((_old: any[], newOps: any[]) => newOps ?? []);
    cleanedOperationMock.mockImplementation((op: any) => op);
    inferSubOperationsMock.mockReturnValue([]);
    // Parent operations look their sub-operations up in this index instead of rescanning the
    // sub-accounts per hash; an empty index is this suite's "no sub-operations" case, the same
    // thing `inferSubOperations` returning [] used to express.
    buildSubOperationIndexMock.mockReturnValue(new Map());
    buildSubAccountsMock.mockReturnValue([]);
    mergeSubAccountsMock.mockImplementation((_old: any[], subs: any[]) => subs ?? []);
    listOperationsMock.mockResolvedValue({ items: [], next: undefined });
    getBridgeApiMock.mockImplementation(defaultBridgeApi);
    resolveA4BaseUrlMock.mockReturnValue("https://a4.test");
    resolveA4ChainConfigMock.mockReturnValue({
      read: true,
      register: true,
      environment: "stg",
      maxDcRoamRetries: 5,
    });
    fetchA4OperationsMock.mockResolvedValue([]);
  });

  const call = () =>
    genericGetAccountShape(network, currency.id)(
      { address: "0xabc", initialAccount: undefined, currency, derivationMode: "" } as any,
      { paginationConfig: {} as any },
    );

  it("calls fetchA4Operations and skips the coin-module delegate when read=true and A4 succeeds", async () => {
    const a4Op = { id: "a4-op-id", hash: "0xtx-a4", type: "IN", accountId: "js:1:ethereum:0xabc:" };
    fetchA4OperationsMock.mockResolvedValue([a4Op]);

    await call();

    expect(fetchA4OperationsMock).toHaveBeenCalledTimes(1);
    expect(listOperationsMock).not.toHaveBeenCalled();
  });

  it("falls back to the coin-module delegate when fetchA4Operations throws with status 5xx", async () => {
    fetchA4OperationsMock.mockRejectedValue(new A4HttpError("server error", 500));

    await call();

    expect(fetchA4OperationsMock).toHaveBeenCalledTimes(1);
    expect(listOperationsMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the coin-module delegate when fetchA4Operations throws with status 422", async () => {
    fetchA4OperationsMock.mockRejectedValue(new A4HttpError("not indexed", 422));

    await call();

    expect(fetchA4OperationsMock).toHaveBeenCalledTimes(1);
    expect(listOperationsMock).toHaveBeenCalledTimes(1);
  });

  it("skips fetchA4Operations and uses the coin-module delegate when read=false", async () => {
    resolveA4ChainConfigMock.mockReturnValue({
      read: false,
      register: true,
      environment: "stg",
      maxDcRoamRetries: 5,
    });

    await call();

    expect(fetchA4OperationsMock).not.toHaveBeenCalled();
    expect(listOperationsMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the coin-module delegate when resolveA4BaseUrl throws (misconfigured env)", async () => {
    resolveA4BaseUrlMock.mockReturnValueOnce("https://a4.test").mockImplementationOnce(() => {
      throw new Error("A4_BASE_URL not set");
    });

    await call();

    expect(fetchA4OperationsMock).not.toHaveBeenCalled();
    expect(listOperationsMock).toHaveBeenCalledTimes(1);
  });

  /*
   * Both adapters call encodeOperationId(accountId, hash, type) with identical arguments,
   * so mergeOps naturally deduplicates the same transaction when the backend switches
   * mid-user-session (e.g. A4 was off on sync N, enabled on sync N+1).
   * This test verifies the A4 adapter's side of that contract.
   */
  it("produces the same op id as encodeOperationId(accountId, hash, type), matching the coin-module adapter contract", () => {
    const accountId = "js:1:ethereum:0xabc:";
    const hash = "0xtx123";

    const a4RawOp = {
      block: { hash: "0xblock", height: 100, time: "2024-01-01T00:00:00Z" },
      tx: { hash },
      assets: { native: "500" },
      events: {},
      failed: false,
      fees: "0",
      feeAsset: "native",
    };

    const [liveOp] = adaptA4OperationToLiveOperation(accountId, "0xabc", a4RawOp);

    expect(liveOp.id).toEqual(encodeOperationId(accountId, hash, liveOp.type));
  });

  it("logs read_served_by_a4 only once across repeated syncs for the same chain", async () => {
    // loggedReadDecisions is a module-level Set in getAccountShape.ts that survives across it()
    // blocks in this file, and earlier tests above already trigger it for "ethereum" (the mocked
    // toA4Network default). Using a chain name unique to this test avoids colliding with that
    // already-consumed dedupe key from prior tests. toA4Network is called twice per call() (once
    // in registerWithA4, once in the read/delegate block), so mockReturnValue (not Once) is used
    // to cover every call in both invocations rather than under-counting.
    jest.mocked(toA4Network).mockReturnValue("dedup-test-chain");

    await call();
    await call();

    // Every other module that could log here (registration, config, fetchA4Operations) is fully
    // mocked out in this file, so this is the only log() call reachable across both syncs.
    expect(jest.mocked(log).mock.calls).toEqual([
      [
        "a4",
        "A4 is serving reads for this chain",
        {
          level: "info",
          decision: "read_served_by_a4",
          chain: "dedup-test-chain",
        },
      ],
    ]);
  });

  it("logs register_off_intentional only once across repeated syncs for the same chain", async () => {
    // Same dedupe reasoning as read_served_by_a4 above, but for registerWithA4's own
    // loggedRegisterOffChains set. A unique chain name avoids colliding with dedupe keys
    // already consumed by other tests in this file.
    jest.mocked(toA4Network).mockReturnValue("register-off-test-chain");
    resolveA4ChainConfigMock.mockReturnValue({
      read: false,
      register: false,
      environment: "stg",
      maxDcRoamRetries: 5,
    });

    await call();
    await call();

    const registerOffCalls = jest
      .mocked(log)
      .mock.calls.filter(([, message]) => message === "A4 registration is off for this chain");

    expect(registerOffCalls).toEqual([
      [
        "a4",
        "A4 registration is off for this chain",
        {
          level: "info",
          decision: "register_off_intentional",
          chain: "register-off-test-chain",
        },
      ],
    ]);
  });
});
