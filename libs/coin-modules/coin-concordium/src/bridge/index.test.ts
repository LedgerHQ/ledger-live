import { lastValueFrom } from "rxjs";
import type { ConcordiumAccount, ConcordiumBridgeContext } from "../types";
import { PUBLIC_KEY, createFixtureConfig } from "../test/fixtures";
import { createBridges } from ".";

jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  getSerializedAddressParameters: jest.fn(),
  makeSync: jest.fn(() => jest.fn(() => jest.requireActual("rxjs").EMPTY)),
  makeScanAccounts: jest.fn(() => jest.fn(() => jest.requireActual("rxjs").EMPTY)),
  mergeOps: jest.fn(),
}));

jest.mock("../network/proxyClient", () => ({
  getAccountsByPublicKey: jest.fn(),
}));

const { getAccountsByPublicKey } = jest.requireMock("../network/proxyClient");

const { makeSync, makeScanAccounts } = jest.requireMock(
  "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers",
);

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
  const mockConfig = jest.fn(async (_currencyId?: string) => createFixtureConfig());
  const context: ConcordiumBridgeContext = { config: mockConfig, logger: () => {} };

  const build = async (enableTokens: boolean): Promise<{ sync: PostSync; scan: PostSync }> => {
    jest.clearAllMocks();
    mockConfig.mockResolvedValue(createFixtureConfig({ enableTokens }));
    const { accountBridge, currencyBridge } = createBridges(undefined as never, context);
    await lastValueFrom(accountBridge.sync(account(), {} as never), { defaultValue: undefined });
    await lastValueFrom(
      currencyBridge.scanAccounts({ currency: { id: "concordium_testnet" } } as never),
      {
        defaultValue: undefined,
      },
    );

    return {
      sync: makeSync.mock.calls[0][0].postSync,
      scan: makeScanAccounts.mock.calls[0][0].postSync,
    };
  };

  it("passes a postSync to both makeSync and makeScanAccounts", async () => {
    const { sync, scan } = await build(false);

    expect(sync).toEqual(expect.any(Function));
    expect(scan).toEqual(expect.any(Function));
  });

  it("merges operations in the shape only, since makeSync's merge drops the oldest", async () => {
    // Not visible from `getAccountShape`: the outer `mergeOps` would re-merge
    // against the stored account, discarding every refetched operation older
    // than the oldest stored one and reinstating stale copies.
    await build(false);

    expect(makeSync.mock.calls[0][0].shouldMergeOps).toBe(false);
  });

  it.each([
    ["sync", (b: { sync: PostSync; scan: PostSync }) => b.sync],
    ["scan", (b: { sync: PostSync; scan: PostSync }) => b.scan],
  ])("removes subAccounts on the %s path when tokens are off", async (_name, pick) => {
    const result = pick(await build(false))(account(), account([{ id: "sub" }]));

    expect("subAccounts" in result).toBe(false);
  });

  it.each([
    ["sync", (b: { sync: PostSync; scan: PostSync }) => b.sync],
    ["scan", (b: { sync: PostSync; scan: PostSync }) => b.scan],
  ])("keeps subAccounts on the %s path when tokens are on", async (_name, pick) => {
    const built = await build(true);
    const synced = account([{ id: "sub" }]);

    expect(pick(built)(account(), synced)).toBe(synced);
  });

  it("resolves the config once per subscription and follows a change between subscriptions", async () => {
    jest.clearAllMocks();
    mockConfig.mockResolvedValueOnce(createFixtureConfig({ enableTokens: false }));
    mockConfig.mockResolvedValueOnce(createFixtureConfig({ enableTokens: true }));
    const { accountBridge } = createBridges(undefined as never, context);
    const synced = account([{ id: "sub" }]);

    await lastValueFrom(accountBridge.sync(account(), {} as never), { defaultValue: undefined });
    expect(mockConfig).toHaveBeenCalledTimes(1);
    await lastValueFrom(accountBridge.sync(account(), {} as never), { defaultValue: undefined });
    expect(mockConfig).toHaveBeenCalledTimes(2);

    const [first, second] = makeSync.mock.calls.map(
      ([options]: [{ postSync: PostSync }]) => options.postSync,
    );
    expect("subAccounts" in first(account(), synced)).toBe(false);
    expect(second(account(), synced)).toBe(synced);
  });

  it("reads the flag per currency, so one network can differ from the other", async () => {
    jest.clearAllMocks();
    mockConfig.mockImplementation(async (currencyId?: string) =>
      createFixtureConfig({ enableTokens: currencyId === "concordium" }),
    );
    const { accountBridge } = createBridges(undefined as never, context);
    const mainnet = { ...account(), currency: { id: "concordium" } } as ConcordiumAccount;
    const synced = account([{ id: "sub" }]);

    await lastValueFrom(accountBridge.sync(mainnet, {} as never), { defaultValue: undefined });
    await lastValueFrom(accountBridge.sync(account(), {} as never), { defaultValue: undefined });

    expect(mockConfig.mock.calls.map(([id]) => id)).toEqual(["concordium", "concordium_testnet"]);
    const [mainnetPostSync, testnetPostSync] = makeSync.mock.calls.map(
      ([options]: [{ postSync: PostSync }]) => options.postSync,
    );
    expect(mainnetPostSync(account(), synced)).toBe(synced);
    expect("subAccounts" in testnetPostSync(account(), synced)).toBe(false);
  });

  it.each([
    [
      "sync",
      async (bridges: ReturnType<typeof createBridges>) =>
        lastValueFrom(bridges.accountBridge.sync(account(), {} as never), {
          defaultValue: undefined,
        }),
      () => makeSync.mock.calls[0][0].getAccountShape,
    ],
    [
      "scan",
      async (bridges: ReturnType<typeof createBridges>) =>
        lastValueFrom(
          bridges.currencyBridge.scanAccounts({ currency: { id: "concordium_testnet" } } as never),
          { defaultValue: undefined },
        ),
      () => makeScanAccounts.mock.calls[0][0].getAccountShape,
    ],
  ])(
    "hands the %s shape a context pinned to the currency's config",
    async (_name, run, pickShape) => {
      jest.clearAllMocks();
      mockConfig.mockImplementation(async (currencyId?: string) =>
        createFixtureConfig({ proxyUrl: `https://${currencyId}.test` }),
      );
      getAccountsByPublicKey.mockResolvedValue([]);
      await run(createBridges(undefined as never, context));

      await pickShape()(
        {
          currency: { id: "concordium_testnet" },
          derivationMode: "",
          derivationPath: "44'/1'/0'/0'/0'/0'",
          index: 0,
          rest: { publicKey: PUBLIC_KEY },
        },
        undefined,
      );

      const [lowerContext] = getAccountsByPublicKey.mock.calls[0];
      expect(lowerContext.logger).toBe(context.logger);
      await expect(lowerContext.config()).resolves.toMatchObject({
        proxyUrl: "https://concordium_testnet.test",
      });
      expect(mockConfig).toHaveBeenCalledTimes(1);
    },
  );
});
