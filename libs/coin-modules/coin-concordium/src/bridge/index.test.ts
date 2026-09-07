import type { ConcordiumAccount } from "../types";
import { createBridges } from ".";

jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  getSerializedAddressParameters: jest.fn(),
  makeSync: jest.fn(() => jest.fn()),
  makeScanAccounts: jest.fn(() => jest.fn()),
  mergeOps: jest.fn(),
}));

jest.mock("../config", () => ({
  __esModule: true,
  default: { setCoinConfig: jest.fn(), getCoinConfig: jest.fn() },
}));

const { makeSync, makeScanAccounts } = jest.requireMock(
  "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers",
);
const coinConfig = jest.requireMock("../config").default;

type PostSync = (initial: ConcordiumAccount, synced: ConcordiumAccount) => ConcordiumAccount;

const account = (subAccounts?: unknown[]): ConcordiumAccount =>
  ({
    id: "acc",
    currency: { id: "concordium_testnet" },
    ...(subAccounts === undefined ? {} : { subAccounts }),
  }) as unknown as ConcordiumAccount;

describe("createBridges", () => {
  it("has a currency bridge and an account bridge with required methods", () => {
    expect(createBridges(undefined as any, {} as any)).toEqual({
      accountBridge: {
        assignFromAccountRaw: expect.any(Function),
        assignToAccountRaw: expect.any(Function),
        broadcast: expect.any(Function),
        createTransaction: expect.any(Function),
        estimateMaxSpendable: expect.any(Function),
        getEstimationRecipient: expect.any(Function),
        getSerializedAddressParameters: expect.any(Function),
        getTransactionStatus: expect.any(Function),
        prepareTransaction: expect.any(Function),
        receive: expect.any(Function),
        signOperation: expect.any(Function),
        signRawOperation: expect.any(Function),
        sync: expect.any(Function),
        updateTransaction: expect.any(Function),
        validateAddress: expect.any(Function),
      },
      currencyBridge: {
        onboardAccount: expect.any(Function),
        pairWalletConnect: expect.any(Function),
        scanAccounts: expect.any(Function),
      },
    });
  });
});

/**
 * Token visibility is cleared in `postSync` rather than in the account shape, so
 * omitting it from either builder silently reintroduces the empty token section.
 */
describe("createBridges token visibility wiring", () => {
  const build = (enableTokens: boolean): { sync: PostSync; scan: PostSync } => {
    jest.clearAllMocks();
    coinConfig.getCoinConfig.mockReturnValue({ enableTokens });
    createBridges(undefined as never, {} as never);

    return {
      sync: makeSync.mock.calls[0][0].postSync,
      scan: makeScanAccounts.mock.calls[0][0].postSync,
    };
  };

  it("passes a postSync to both makeSync and makeScanAccounts", () => {
    const { sync, scan } = build(false);

    expect(sync).toEqual(expect.any(Function));
    expect(scan).toEqual(expect.any(Function));
  });

  it.each([
    ["sync", (b: { sync: PostSync; scan: PostSync }) => b.sync],
    ["scan", (b: { sync: PostSync; scan: PostSync }) => b.scan],
  ])("removes subAccounts on the %s path when tokens are off", (_name, pick) => {
    const result = pick(build(false))(account(), account([{ id: "sub" }]));

    expect("subAccounts" in result).toBe(false);
  });

  it.each([
    ["sync", (b: { sync: PostSync; scan: PostSync }) => b.sync],
    ["scan", (b: { sync: PostSync; scan: PostSync }) => b.scan],
  ])("keeps subAccounts on the %s path when tokens are on", (_name, pick) => {
    const built = build(true);
    const synced = account([{ id: "sub" }]);

    expect(pick(built)(account(), synced)).toBe(synced);
  });

  it("reads the flag per currency, so one network can differ from the other", () => {
    build(false).sync(account(), account([]));

    expect(coinConfig.getCoinConfig).toHaveBeenCalledWith("concordium_testnet");
  });
});
