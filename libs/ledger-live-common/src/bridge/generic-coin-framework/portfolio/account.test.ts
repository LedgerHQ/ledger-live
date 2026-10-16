import BigNumber from "bignumber.js";
import { readHistory } from "@ledgerhq/account-module-framework";
import {
  createSingleAddressAccountModule,
  SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
} from "@ledgerhq/account-module-single-address";
import {
  PortfolioApiError,
  type AccountStatus,
  type PortfolioApi,
} from "@ledgerhq/portfolio-module-framework";
import { createMemoryPortfolioStore } from "@ledgerhq/portfolio-module-local";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import type { Account } from "@ledgerhq/types-live";
import { tokensSyncHash } from "../assembly/syncHash";
import {
  ADDRESS,
  ADDRESS_PATH,
  BITCOIN_ACCOUNT_ID,
  bitcoin,
  bitcoinAccount,
  fakeAccountModule,
  fakeBinding,
  fakeCoinModule,
  liveOperation,
  mockLiveConfig,
  portfolioCoinConfig,
  ripple,
  RIPPLE_ACCOUNT_ID,
  rippleAccount,
  serviceStandIn,
  standInNetwork,
  XPUB,
  type FakeCoinModule,
} from "../tests/portfolioFixtures";
import {
  accountSides,
  isSeeded,
  moduleStateOf,
  openAccountPortfolio,
  portfolioSyncHash,
  registers,
  registrationOf,
  SEEDED_DETAILS_KEY,
  serviceSynchronized,
  type AccountPortfolioDeps,
  type AccountRegistration,
  type PortfolioAccountSource,
} from "./account";

jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));
jest.mock("@ledgerhq/portfolio-module-local", () => {
  const actual = jest.requireActual("@ledgerhq/portfolio-module-local");
  return { ...actual, createMemoryPortfolioStore: jest.fn(actual.createMemoryPortfolioStore) };
});

const SERVICE_URL = "https://portfolio.test";
const context = { config: async () => ({}), logger: () => undefined } as never;

const rippleSource = (fields: Partial<PortfolioAccountSource> = {}): PortfolioAccountSource => ({
  currency: ripple,
  accountId: RIPPLE_ACCOUNT_ID,
  key: ADDRESS,
  derivationMode: "",
  derivationPath: ADDRESS_PATH,
  index: 0,
  ...fields,
});

const bitcoinSource = (fields: Partial<PortfolioAccountSource> = {}): PortfolioAccountSource => ({
  currency: bitcoin,
  accountId: BITCOIN_ACCOUNT_ID,
  key: XPUB,
  derivationMode: "native_segwit",
  derivationPath: "84'/0'/0'",
  index: 0,
  ...fields,
});

const RIPPLE_PORTFOLIO = `wallet:${RIPPLE_ACCOUNT_ID}`;
const BITCOIN_PORTFOLIO = `wallet:${BITCOIN_ACCOUNT_ID}`;

function configure(
  mode: "local" | "hybrid" | "remote" | undefined,
  url: string = SERVICE_URL,
): void {
  mockLiveConfig({
    config_portfolio_service: { url, portfolioId: "wallet" },
    config_currency_ripple: portfolioCoinConfig(mode),
    config_currency_bitcoin: portfolioCoinConfig(mode),
  });
}

type ServiceAccount = { id: string; network: string; status: AccountStatus };

const synchronized = (network = "xrp"): ServiceAccount => ({
  id: "service-account",
  network,
  status: "synchronized",
});

/**
 * A remote side answering `portfolio` (or failing with `error`), its writes recorded. What it
 * registers comes back with `registered` accounts.
 */
function fakeRemote({
  portfolio,
  error,
  registered = [synchronized()],
}: {
  portfolio?: Awaited<ReturnType<PortfolioApi["getPortfolio"]>>;
  error?: Error;
  registered?: ServiceAccount[];
}): jest.Mocked<PortfolioApi> {
  const remote = {
    getPortfolio: jest.fn(async () => {
      if (error) throw error;
      return portfolio;
    }),
    createPortfolio: jest.fn(async (id: string) => ({ id })),
    addRegistrations: jest.fn(async (id: string) => ({ id, accounts: registered })),
  } as unknown as jest.Mocked<PortfolioApi>;
  (createPortfolioServiceClient as jest.Mock).mockReturnValue(remote);
  return remote;
}

let coinModule: FakeCoinModule;

const deps = (fields: Partial<AccountPortfolioDeps> = {}): AccountPortfolioDeps => ({
  binding: undefined,
  coinModuleApi: coinModule as never,
  context,
  bridgeApi: {},
  ...fields,
});

/** The `syncHash` a read of a ripple account gives, without blacklisted tokens. */
const rippleSyncHash = async (mode: "local" | "hybrid" | "remote") =>
  portfolioSyncHash(mode, await tokensSyncHash("ripple", { paginationConfig: {} }, {}));

/** The stored account of a local side, as Ledger Wallet's store holds it. */
async function storedAccount(opened: { store: { get: (id: string) => Promise<unknown> } }) {
  const portfolio = (await opened.store.get(RIPPLE_PORTFOLIO)) as
    | { accounts: { id: string; state?: unknown; descriptor?: unknown }[] }
    | undefined;
  return portfolio?.accounts.find(({ id }) => id === RIPPLE_ACCOUNT_ID);
}

beforeEach(() => {
  jest.clearAllMocks();
  coinModule = fakeCoinModule();
});

afterEach(() => jest.restoreAllMocks());

describe("registrationOf", () => {
  it("registers the address of a single-address account, keyed by its account id", () => {
    expect(registrationOf(rippleSource(), undefined)).toEqual({
      type: "static",
      accountId: RIPPLE_ACCOUNT_ID,
      network: "xrp",
      addresses: [ADDRESS],
    });
  });

  it("registers the extended public key of an account module account", () => {
    expect(registrationOf(bitcoinSource(), fakeBinding(fakeAccountModule()))).toEqual({
      type: "auto_derive",
      network: "bitcoin",
      xpub: XPUB,
    });
  });
});

describe("registers", () => {
  const autoDerive = { type: "auto_derive", network: "bitcoin", xpub: XPUB } as const;
  const staticInput: AccountRegistration = {
    type: "static",
    accountId: RIPPLE_ACCOUNT_ID,
    network: "xrp",
    addresses: [ADDRESS],
  };

  it("matches the same key on the same network, whatever id the side gave it", () => {
    expect(registers(autoDerive, { ...autoDerive, id: "any" })).toBe(true);
    expect(
      registers(staticInput, {
        type: "static",
        id: "any",
        network: "xrp",
        addresses: ["rOther", ADDRESS],
      }),
    ).toBe(true);
  });

  it("tells apart another key, network or type", () => {
    expect(registers(autoDerive, { ...autoDerive, id: "a", xpub: "xpubOther" })).toBe(false);
    expect(registers(autoDerive, { ...autoDerive, id: "a", network: "litecoin" })).toBe(false);
    expect(registers(autoDerive, { type: "evm", id: "a", address: XPUB })).toBe(false);
    expect(
      registers(staticInput, { type: "static", id: "a", network: "xrp", addresses: ["rOther"] }),
    ).toBe(false);
    expect(registers(staticInput, { type: "static", id: "a", network: "xrp" })).toBe(false);
  });
});

describe("moduleStateOf", () => {
  const noLookup = { resumable: true, getAssetFromToken: undefined };

  it("is the state the binding reads from the account, whatever synced it", () => {
    const binding = fakeBinding(fakeAccountModule());
    const account = bitcoinAccount();
    expect(moduleStateOf(binding, account, noLookup)).toEqual({
      version: 1,
      data: { persisted: BITCOIN_ACCOUNT_ID },
    });
    expect(binding.readState).toHaveBeenCalledWith(account);
  });

  it("is the height a single-address account was synced at when the read resumes, and the balances legacy validates with", () => {
    const getAssetFromToken = jest.fn();
    const account = rippleAccount({
      blockHeight: 100,
      balance: new BigNumber(1_000),
      spendableBalance: new BigNumber(800),
      pendingOperations: [liveOperation({ type: "OUT", value: new BigNumber(100) })],
    });
    expect(moduleStateOf(undefined, account, { resumable: true, getAssetFromToken })).toEqual({
      version: SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
      // The reserve (200) and the pending send (100 and its fee of 10) are locked.
      data: {
        syncedHeight: 100,
        balances: [{ value: "1000", asset: { type: "native" }, locked: "310" }],
        stakes: [],
      },
    });
  });

  it("carves the staking positions out of the native balance of a family that partitions it", () => {
    const account = rippleAccount({
      balance: new BigNumber(1_000),
      spendableBalance: new BigNumber(1_000),
      stakingResources: {
        delegations: [
          {
            validatorAddress: "validator",
            amount: new BigNumber(300),
            pendingRewards: new BigNumber(0),
            status: "bonded",
          },
        ],
        redelegations: [],
        unbondings: [],
        delegatedBalance: new BigNumber(300),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
      },
    } as never);
    const state = moduleStateOf(undefined, account, {
      ...noLookup,
      partitionsNativeBalance: true,
      // The position holds its rent too.
      getHeldNativeAmount: position => position.amount.plus(20),
    });

    expect(state?.data).toMatchObject({
      balances: [
        { value: "680", asset: { type: "native" }, locked: "0" },
        { value: "320", locked: "320", stake: { amount: "300", delegate: "validator" } },
      ],
    });
  });

  it("lists from scratch when the read does not resume, or for a write", () => {
    const account = rippleAccount({ blockHeight: 100 });
    expect(moduleStateOf(undefined, account, { ...noLookup, resumable: false })).toMatchObject({
      data: { syncedHeight: 0, balances: [{ value: "0", locked: "0" }] },
    });
  });

  it("holds no balance for an account not there yet", () => {
    for (const resumable of [true, false]) {
      expect(moduleStateOf(undefined, undefined, { ...noLookup, resumable })).toEqual({
        version: SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
        data: { syncedHeight: 0, balances: [], stakes: [] },
      });
    }
  });
});

describe("portfolioSyncHash", () => {
  it("tells the modes apart, over the tokens hash of the legacy path", () => {
    expect(portfolioSyncHash("local", "0xabc-2")).toBe("portfolio-local-0xabc-2");
    expect(portfolioSyncHash("remote", "0xabc")).not.toBe(portfolioSyncHash("hybrid", "0xabc"));
  });
});

describe("isSeeded", () => {
  const view = (details?: Record<string, unknown>) =>
    ({ id: "op", ...(details ? { details } : {}) }) as never;

  it("tells an operation Ledger Wallet seeded from one the module listed", () => {
    expect(isSeeded(view({ [SEEDED_DETAILS_KEY]: true }))).toBe(true);
    expect(isSeeded(view({ [SEEDED_DETAILS_KEY]: "true" }))).toBe(false);
    expect(isSeeded(view({}))).toBe(false);
    expect(isSeeded(view())).toBe(false);
  });
});

describe("accountSides", () => {
  const binding = fakeBinding(fakeAccountModule());

  it("registers a read where its mode says", () => {
    expect(accountSides("local", "read", undefined)).toEqual(["local"]);
    expect(accountSides("hybrid", "read", undefined)).toEqual(["local", "remote"]);
    expect(accountSides("remote", "read", undefined)).toEqual(["remote"]);
  });

  it("keeps the local twin of an account module family in remote mode", () => {
    expect(accountSides("remote", "read", binding)).toEqual(["local", "remote"]);
    expect(accountSides("local", "read", binding)).toEqual(["local"]);
  });

  it("registers a write on the local side when it writes, nowhere otherwise", () => {
    expect(accountSides("local", "write", binding)).toEqual(["local"]);
    expect(accountSides("hybrid", "write", undefined)).toEqual(["local"]);
    expect(accountSides("remote", "write", binding)).toEqual([]);
  });
});

const portfolioOf = (...accounts: ServiceAccount[]) => ({ id: "p", accounts });

describe("serviceSynchronized", () => {
  it("is whether every account of the network is synchronized", () => {
    expect(serviceSynchronized(portfolioOf(synchronized()), "xrp")).toBe(true);
    expect(
      serviceSynchronized(
        portfolioOf(synchronized(), { id: "other", network: "xrp", status: "uninitialized" }),
        "xrp",
      ),
    ).toBe(false);
  });

  it("is not while the service holds no account of the network", () => {
    expect(serviceSynchronized(portfolioOf(synchronized("bitcoin")), "xrp")).toBe(false);
    expect(serviceSynchronized({ id: "p" }, "xrp")).toBe(false);
  });

  it("fails for an account the service failed to register", () => {
    expect(() =>
      serviceSynchronized(
        portfolioOf({ id: "broken", network: "xrp", status: "registration_failure" }),
        "xrp",
      ),
    ).toThrow("The portfolio-service failed to register the xrp account broken");
  });
});

describe("openAccountPortfolio in local mode", () => {
  beforeEach(() => configure("local", ""));

  it("registers a scanned single-address account locally, under the portfolio of its own", async () => {
    const opened = await openAccountPortfolio(rippleSource({ index: 2 }), deps());

    expect(opened).toMatchObject({
      portfolioId: RIPPLE_PORTFOLIO,
      network: "xrp",
      mode: "local",
      readSide: "local",
      syncHash: await rippleSyncHash("local"),
      resumable: false,
      getTokenFromAsset: undefined,
    });
    await expect(opened.store.get(RIPPLE_PORTFOLIO)).resolves.toMatchObject({
      registrations: [
        { type: "static", id: `lw:${RIPPLE_ACCOUNT_ID}`, network: "xrp", addresses: [ADDRESS] },
      ],
      accounts: [{ id: RIPPLE_ACCOUNT_ID, network: "xrp", status: "uninitialized" }],
    });
    // The reads of the network are served without any service, the reader being the local side.
    const balances = {
      items: [{ type: "success", network: "xrp", account_id: RIPPLE_ACCOUNT_ID, items: [] }],
    };
    await expect(
      opened.portfolio.getPortfolioBalance(RIPPLE_PORTFOLIO, { network: "xrp" }),
    ).resolves.toEqual(balances);
    await expect(
      opened.reader.getPortfolioBalance(RIPPLE_PORTFOLIO, { network: "xrp" }),
    ).resolves.toEqual(balances);
    // The service holds no portfolio when it has no url: the reads of both sides still answer.
    await expect(opened.portfolio.getPortfolio(RIPPLE_PORTFOLIO)).resolves.toMatchObject({
      id: RIPPLE_PORTFOLIO,
    });
    // The account's own descriptor, not the one the local side derives from the address alone.
    await expect(storedAccount(opened)).resolves.toMatchObject({
      descriptor: {
        currencyId: "ripple",
        derivationMode: "",
        index: 2,
        key: ADDRESS,
        derivationPath: ADDRESS_PATH,
      },
      state: { data: { syncedHeight: 0, balances: [], stakes: [] } },
    });
    await expect(readHistory(opened.store.history(RIPPLE_ACCOUNT_ID))).resolves.toEqual([]);
    await expect(
      opened.portfolio.getFreshAddress?.(RIPPLE_PORTFOLIO, RIPPLE_ACCOUNT_ID),
    ).resolves.toEqual({ address: ADDRESS, derivation_path: ADDRESS_PATH });
    expect(createPortfolioServiceClient).not.toHaveBeenCalled();
  });

  it("resumes a synced single-address account above the block of its newest operation, from the operations of that block", async () => {
    const account = rippleAccount({
      blockHeight: 100,
      syncHash: await rippleSyncHash("local"),
      operations: [
        liveOperation(),
        liveOperation({ id: "op-2", hash: "known-2", type: "OUT" }),
        liveOperation({ id: "older", hash: "older", blockHeight: 80 }),
        liveOperation({ id: "unconfirmed", hash: "unconfirmed", blockHeight: null }),
      ],
      pendingOperations: [
        liveOperation({ hash: "sent", type: "OUT", blockHeight: undefined, date: new Date() }),
      ],
    });
    const opened = await openAccountPortfolio(rippleSource({ account }), deps());

    expect(opened.resumable).toBe(true);
    await expect(storedAccount(opened)).resolves.toMatchObject({
      state: {
        version: SINGLE_ADDRESS_ACCOUNT_STATE_VERSION,
        data: { syncedHeight: 100, stakes: [] },
      },
    });
    const seeded = await readHistory(opened.store.history(RIPPLE_ACCOUNT_ID));
    expect(
      seeded.map(({ hash, optimistic, details }) => ({
        hash,
        optimistic,
        seeded: details?.[SEEDED_DETAILS_KEY],
      })),
    ).toEqual([
      { hash: "sent", optimistic: true, seeded: undefined },
      { hash: "known-2", optimistic: undefined, seeded: true },
      { hash: "known", optimistic: undefined, seeded: true },
    ]);

    await opened.portfolio.sync(RIPPLE_PORTFOLIO);

    // Above the block of the newest operation the account holds.
    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 91,
      cursor: undefined,
      order: "desc",
    });
    await expect(storedAccount(opened)).resolves.toMatchObject({
      state: { data: { syncedHeight: 120 } },
    });
    const synced = await readHistory(opened.store.history(RIPPLE_ACCOUNT_ID));
    expect(synced.map(({ hash }) => hash)).toEqual(["sent", "in-hash", "known-2", "known"]);
  });

  it("resumes above the block of its newest operation, though a higher block shares its date", async () => {
    // Operations sharing a date are ordered by id: the newest one sits in the lower block.
    const date = new Date("2026-09-01T10:00:00Z");
    const account = rippleAccount({
      blockHeight: 100,
      syncHash: await rippleSyncHash("local"),
      operations: [
        liveOperation({ id: "a", hash: "a", blockHeight: 30, date }),
        liveOperation({ id: "b", hash: "b", blockHeight: 31, date }),
        liveOperation({ id: "c", hash: "c", blockHeight: 30, date }),
      ],
    });
    const opened = await openAccountPortfolio(rippleSource({ account }), deps());

    const seeded = await readHistory(opened.store.history(RIPPLE_ACCOUNT_ID));
    expect(seeded.map(({ hash, block }) => [hash, block?.height])).toEqual([
      ["a", 30],
      ["c", 30],
    ]);
    await opened.portfolio.sync(RIPPLE_PORTFOLIO);
    // As legacy: above the newest operation, whose block a late operation may still join.
    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 31,
      cursor: undefined,
      order: "desc",
    });
  });

  it("seeds no confirmed operation when the newest one has no block", async () => {
    const account = rippleAccount({
      blockHeight: 100,
      syncHash: await rippleSyncHash("local"),
      operations: [
        liveOperation({ id: "unconfirmed", hash: "unconfirmed", blockHeight: null }),
        liveOperation(),
      ],
      pendingOperations: [liveOperation({ hash: "sent", type: "OUT", blockHeight: undefined })],
    });
    const opened = await openAccountPortfolio(rippleSource({ account }), deps());

    const seeded = await readHistory(opened.store.history(RIPPLE_ACCOUNT_ID));
    expect(seeded.map(({ hash, optimistic }) => [hash, optimistic])).toEqual([["sent", true]]);
    await opened.portfolio.sync(RIPPLE_PORTFOLIO);
    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 0,
      cursor: undefined,
      order: "desc",
    });
  });

  it.each([
    ["the legacy path synced", "tokens-hash", {}],
    ["another mode synced", "portfolio-hybrid-…", {}],
    ["was synced with other blacklisted tokens", undefined, { blacklistedTokenIds: ["t"] }],
  ])("lists from scratch an account %s, its operations replaced", async (_, syncHash, sync) => {
    const account = rippleAccount({
      blockHeight: 100,
      syncHash: syncHash ?? (await rippleSyncHash("local")),
      operations: [liveOperation()],
    });
    const opened = await openAccountPortfolio(rippleSource({ account }), deps(), "read", {
      syncConfig: { paginationConfig: {}, ...sync },
    });

    expect(opened.resumable).toBe(false);
    await opened.portfolio.sync(RIPPLE_PORTFOLIO);

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 0,
      cursor: undefined,
      order: "desc",
    });
    const history = await readHistory(opened.store.history(RIPPLE_ACCOUNT_ID));
    expect(history.map(({ id }) => id)).toEqual(["coin-op-in"]);
  });

  it("lists from scratch an account never synced", async () => {
    const account = rippleAccount({ blockHeight: 0, syncHash: await rippleSyncHash("local") });
    const opened = await openAccountPortfolio(rippleSource({ account }), deps());
    expect(opened.resumable).toBe(false);
  });

  it("serves an account module account from its extended public key, its persisted state and its whole history", async () => {
    const module = fakeAccountModule();
    const binding = fakeBinding(module);
    const account = bitcoinAccount({
      blockHeight: 800,
      operations: [liveOperation(), liveOperation({ hash: "older", blockHeight: 80 })],
    });
    const opened = await openAccountPortfolio(bitcoinSource({ account }), deps({ binding }));

    expect(binding.create).toHaveBeenCalledWith(coinModule, "bitcoin");
    await expect(opened.store.get(BITCOIN_PORTFOLIO)).resolves.toMatchObject({
      registrations: [{ type: "auto_derive", network: "bitcoin", xpub: XPUB }],
      accounts: [{ id: BITCOIN_ACCOUNT_ID, network: "bitcoin" }],
    });
    // Its module owns the whole history: nothing is marked as seeded.
    const history = await readHistory(opened.store.history(BITCOIN_ACCOUNT_ID));
    expect(history.map(({ hash, details }) => [hash, details?.[SEEDED_DETAILS_KEY]])).toEqual([
      ["known", undefined],
      ["older", undefined],
    ]);

    await opened.portfolio.sync(BITCOIN_PORTFOLIO);

    expect(module.sync).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        descriptor: {
          currencyId: "bitcoin",
          derivationMode: "native_segwit",
          index: 0,
          key: XPUB,
          derivationPath: "84'/0'/0'",
        },
        state: { version: 1, data: { persisted: BITCOIN_ACCOUNT_ID } },
      }),
      {},
    );
    await expect(opened.store.get(BITCOIN_PORTFOLIO)).resolves.toMatchObject({
      accounts: [{ state: { version: 1, data: { balance: "900", locked: "100" } } }],
    });
  });

  it("seeds the account it serves only, whatever else the store holds", async () => {
    const store = createMemoryPortfolioStore();
    const other = { id: "other", network: "xrp", registrationId: "r0", status: "synchronized" };
    await store.put({ id: RIPPLE_PORTFOLIO, registrations: [], accounts: [other] } as never);
    (createMemoryPortfolioStore as jest.Mock).mockReturnValueOnce(store);

    const account = rippleAccount({ blockHeight: 100, syncHash: await rippleSyncHash("local") });
    await openAccountPortfolio(rippleSource({ account }), deps());

    const stored = await store.get(RIPPLE_PORTFOLIO);
    expect(stored?.accounts).toEqual([
      other,
      expect.objectContaining({
        id: RIPPLE_ACCOUNT_ID,
        state: expect.objectContaining({ data: expect.objectContaining({ syncedHeight: 100 }) }),
      }),
    ]);
  });

  it("refuses an account the local side keys otherwise", async () => {
    await expect(
      openAccountPortfolio(
        bitcoinSource({ accountId: "elsewhere" }),
        deps({ binding: fakeBinding(fakeAccountModule()) }),
      ),
    ).rejects.toThrow("The local portfolio wallet:elsewhere does not serve account elsewhere");
  });

  it("tells why the last sync of the account failed, in the portfolio it answers", async () => {
    coinModule.lastBlock.mockRejectedValue(new Error("node down"));
    const opened = await openAccountPortfolio(rippleSource(), deps());

    await opened.portfolio.sync(RIPPLE_PORTFOLIO);

    await expect(opened.reader.getPortfolio(RIPPLE_PORTFOLIO)).resolves.toMatchObject({
      accounts: [{ id: RIPPLE_ACCOUNT_ID, error: { name: "Error", message: "node down" } }],
    });
  });

  it("tells no error for a sync that succeeds", async () => {
    const opened = await openAccountPortfolio(rippleSource(), deps());

    await opened.portfolio.sync(RIPPLE_PORTFOLIO);

    const { accounts } = await opened.reader.getPortfolio(RIPPLE_PORTFOLIO);
    expect(accounts?.[0]).not.toHaveProperty("error");
  });

  it("registers a write on the local side, which writes from the balances the account locks", async () => {
    const account = rippleAccount({
      blockHeight: 100,
      syncHash: await rippleSyncHash("local"),
      balance: new BigNumber(1_000),
      spendableBalance: new BigNumber(1_000),
      operations: [liveOperation()],
    });
    const opened = await openAccountPortfolio(rippleSource({ account }), deps(), "write");

    expect(opened).toMatchObject({ syncHash: undefined, resumable: false });
    await expect(storedAccount(opened)).resolves.toMatchObject({
      state: {
        data: {
          syncedHeight: 0,
          balances: [{ value: "1000", asset: { type: "native" }, locked: "0" }],
        },
      },
    });
    // A write lists nothing: no operation is seeded but the pending ones.
    await expect(readHistory(opened.store.history(RIPPLE_ACCOUNT_ID))).resolves.toEqual([]);
    await opened.portfolio.encodeTransaction("xrp", {
      intent: { type: "send", sender: ADDRESS, recipient: "rOther", amount: "1" },
      customFees: "10",
    });
    // Through the account module of the account: it sequences the transaction.
    expect(coinModule.getNextSequence).toHaveBeenCalledWith(context, ADDRESS);
  });

  it("gives the local side the family's catalog lookup, asked once per asset, and its balance options", async () => {
    const token = {
      id: "ripple/token/usd",
      name: "US Dollar",
      ticker: "USD",
      units: [{ magnitude: 2 }],
    };
    const getTokenFromAsset = jest.fn(async () => token as never);
    const balanceOptions = { includeAssets: async () => true };
    const opened = await openAccountPortfolio(
      rippleSource(),
      deps({ bridgeApi: { getTokenFromAsset, balanceOptions } }),
    );

    await opened.portfolio.sync(RIPPLE_PORTFOLIO);

    expect(coinModule.getBalance).toHaveBeenCalledWith(context, ADDRESS, balanceOptions);
    const page = await opened.reader.getPortfolioBalance(RIPPLE_PORTFOLIO, { network: "xrp" });
    const entries = page.items?.[0].type === "success" ? page.items[0].items : [];
    expect(entries?.find(({ asset }) => asset === "USD.rIssuer")).toMatchObject({
      cal_id: "ripple/token/usd",
      name: "US Dollar",
      ticker: "USD",
      decimals: 2,
    });
    const asset = { type: "token", assetReference: "USD.rIssuer" };
    await expect(opened.getTokenFromAsset?.(asset)).resolves.toBe(token);
    await expect(opened.getTokenFromAsset?.({ ...asset, assetOwner: "rIssuer" })).resolves.toBe(
      token,
    );
    expect(getTokenFromAsset.mock.calls).toEqual([[asset], [{ ...asset, assetOwner: "rIssuer" }]]);
  });

  it("is the mode of a coin config that names none", async () => {
    configure(undefined, "");
    const opened = await openAccountPortfolio(rippleSource(), deps());
    expect(opened.mode).toBe("local");
  });

  it("wires no service, though a url is configured: what the router asks both sides stays local", async () => {
    configure("local", SERVICE_URL);
    const opened = await openAccountPortfolio(rippleSource(), deps());

    await expect(opened.portfolio.getPortfolio(RIPPLE_PORTFOLIO)).resolves.toMatchObject({
      id: RIPPLE_PORTFOLIO,
    });
    // An account extension through the router, which asks both sides who holds the account.
    await expect(
      opened.portfolio.getFreshAddress?.(RIPPLE_PORTFOLIO, RIPPLE_ACCOUNT_ID),
    ).resolves.toEqual({ address: ADDRESS, derivation_path: ADDRESS_PATH });
    expect(createPortfolioServiceClient).not.toHaveBeenCalled();
  });
});

describe("openAccountPortfolio in remote mode", () => {
  beforeEach(() => configure("remote"));

  it("creates the portfolio on the service and registers the account there only", async () => {
    const remote = fakeRemote({ error: new PortfolioApiError("NOT_FOUND", "absent") });
    const account = rippleAccount({
      blockHeight: 100,
      syncHash: await rippleSyncHash("remote"),
      operations: [liveOperation()],
    });
    const opened = await openAccountPortfolio(rippleSource({ account }), deps());

    expect(createPortfolioServiceClient).toHaveBeenCalledWith({ baseUrl: SERVICE_URL });
    expect(remote.createPortfolio).toHaveBeenCalledWith(RIPPLE_PORTFOLIO);
    expect(remote.addRegistrations).toHaveBeenCalledWith(RIPPLE_PORTFOLIO, [
      { type: "static", accountId: RIPPLE_ACCOUNT_ID, network: "xrp", addresses: [ADDRESS] },
    ]);
    expect(opened).toMatchObject({
      readSide: "remote",
      reader: opened.portfolio,
      syncHash: await rippleSyncHash("remote"),
      resumable: true,
    });
    // Nothing registered locally: nothing is seeded, nothing synced on the client.
    await expect(storedAccount(opened)).resolves.toBeUndefined();
    await expect(readHistory(opened.store.history(RIPPLE_ACCOUNT_ID))).resolves.toEqual([]);
    await opened.portfolio.sync(RIPPLE_PORTFOLIO);
    expect(coinModule.lastBlock).not.toHaveBeenCalled();
  });

  it("fails with UNAVAILABLE while the service has not synchronized the account", async () => {
    fakeRemote({
      portfolio: { id: RIPPLE_PORTFOLIO },
      registered: [{ id: RIPPLE_ACCOUNT_ID, network: "xrp", status: "uninitialized" }],
    });
    await expect(openAccountPortfolio(rippleSource(), deps())).rejects.toMatchObject({
      type: "UNAVAILABLE",
      message: `The portfolio-service has not synchronized the xrp account ${RIPPLE_ACCOUNT_ID} yet`,
    });
  });

  it("fails when the service failed to register the account", async () => {
    fakeRemote({
      portfolio: { id: RIPPLE_PORTFOLIO },
      registered: [{ id: "broken", network: "xrp", status: "registration_failure" }],
    });
    await expect(openAccountPortfolio(rippleSource(), deps())).rejects.toThrow(
      "The portfolio-service failed to register the xrp account broken",
    );
  });

  it("syncs the hidden local twin of an account module family, which reads until the service has synchronized it", async () => {
    const module = fakeAccountModule();
    const remote = fakeRemote({
      portfolio: { id: BITCOIN_PORTFOLIO },
      registered: [{ id: "service-account", network: "bitcoin", status: "uninitialized" }],
    });
    const opened = await openAccountPortfolio(
      bitcoinSource({ account: bitcoinAccount() }),
      deps({ binding: fakeBinding(module) }),
    );

    expect(remote.addRegistrations).toHaveBeenCalledTimes(1);
    await expect(opened.store.get(BITCOIN_PORTFOLIO)).resolves.toMatchObject({
      accounts: [{ id: BITCOIN_ACCOUNT_ID, network: "bitcoin" }],
    });
    expect(opened.readSide).toBe("local");
    await opened.portfolio.sync(BITCOIN_PORTFOLIO);
    expect(module.sync).toHaveBeenCalled();
    await expect(
      opened.reader.getPortfolioBalance(BITCOIN_PORTFOLIO, { network: "bitcoin" }),
    ).resolves.toMatchObject({ items: [{ type: "success", account_id: BITCOIN_ACCOUNT_ID }] });
  });

  it("registers a write nowhere: the service writes for the network", async () => {
    const remote = fakeRemote({ error: new Error("service down") });
    const opened = await openAccountPortfolio(
      rippleSource({ account: rippleAccount({ operations: [liveOperation()] }) }),
      deps(),
      "write",
    );

    expect(remote.getPortfolio).not.toHaveBeenCalled();
    await expect(opened.store.get(RIPPLE_PORTFOLIO)).resolves.toMatchObject({ accounts: [] });
    expect(opened.mode).toBe("remote");
  });

  it("does not register again what the service already holds", async () => {
    const remote = fakeRemote({
      portfolio: {
        id: BITCOIN_PORTFOLIO,
        registrations: [{ type: "auto_derive", id: "service-id", network: "bitcoin", xpub: XPUB }],
        accounts: [synchronized("bitcoin")],
      },
    });
    await openAccountPortfolio(
      bitcoinSource(),
      deps({ binding: fakeBinding(fakeAccountModule()) }),
    );
    expect(remote.createPortfolio).not.toHaveBeenCalled();
    expect(remote.addRegistrations).not.toHaveBeenCalled();
  });

  it("registers the account next to what else the service holds", async () => {
    const remote = fakeRemote({
      portfolio: {
        id: RIPPLE_PORTFOLIO,
        registrations: [{ type: "static", id: "s", network: "xrp", addresses: ["rOther"] }],
      },
    });
    await openAccountPortfolio(rippleSource(), deps());
    expect(remote.addRegistrations).toHaveBeenCalledTimes(1);
  });

  it("registers on a portfolio the service answers without registrations", async () => {
    const remote = fakeRemote({ portfolio: { id: RIPPLE_PORTFOLIO } });
    await openAccountPortfolio(rippleSource(), deps());
    expect(remote.addRegistrations).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["an error of the service", new PortfolioApiError("INTERNAL_ERROR", "service down")],
    ["any other error", new Error("socket hang up")],
  ])("fails on %s other than NOT_FOUND", async (_name, error) => {
    const remote = fakeRemote({ error });
    await expect(openAccountPortfolio(rippleSource(), deps())).rejects.toBe(error);
    expect(remote.createPortfolio).not.toHaveBeenCalled();
  });

  it("fails with UNAVAILABLE without a service url", async () => {
    configure("remote", "");
    await expect(openAccountPortfolio(rippleSource(), deps())).rejects.toMatchObject({
      type: "UNAVAILABLE",
    });
    expect(createPortfolioServiceClient).not.toHaveBeenCalled();
  });
});

describe("openAccountPortfolio in hybrid mode", () => {
  beforeEach(() => configure("hybrid"));

  it("registers on both sides, reads the service and keeps the local twin hidden", async () => {
    const serviceCoinModule = fakeCoinModule({
      lastBlock: jest.fn(async () => ({ height: 130, hash: "h", time: new Date() })),
    });
    const service = serviceStandIn(
      "xrp",
      standInNetwork(
        ripple,
        serviceCoinModule,
        createSingleAddressAccountModule(serviceCoinModule as never),
        "static",
      ),
    );
    (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);

    const opened = await openAccountPortfolio(rippleSource(), deps());

    expect(service.addRegistrations).toHaveBeenCalledTimes(1);
    await expect(opened.portfolio.getPortfolio(RIPPLE_PORTFOLIO)).resolves.toEqual({
      id: RIPPLE_PORTFOLIO,
      registrations: [
        { type: "static", id: "service-registration", network: "xrp", addresses: [ADDRESS] },
      ],
      accounts: [{ id: RIPPLE_ACCOUNT_ID, network: "xrp", status: "synchronized" }],
    });
    await expect(opened.portfolio.getLastBlock("xrp")).resolves.toMatchObject({ height: 130 });
    expect(opened).toMatchObject({ readSide: "remote", reader: opened.portfolio });

    await opened.portfolio.sync(RIPPLE_PORTFOLIO);

    // The hidden twin is synced by the client's own coin module.
    expect(coinModule.lastBlock).toHaveBeenCalled();
    await expect(storedAccount(opened)).resolves.toMatchObject({
      state: { data: { syncedHeight: 120 } },
    });
  });
});

describe("openAccountPortfolio in hybrid mode, the service lagging", () => {
  beforeEach(() => configure("hybrid"));

  it("reads the local twin until the service has synchronized the account", async () => {
    fakeRemote({
      portfolio: { id: RIPPLE_PORTFOLIO },
      registered: [{ id: RIPPLE_ACCOUNT_ID, network: "xrp", status: "uninitialized" }],
    });
    const opened = await openAccountPortfolio(rippleSource(), deps());

    expect(opened.readSide).toBe("local");
    await opened.portfolio.sync(RIPPLE_PORTFOLIO);
    await expect(opened.reader.getLastBlock("xrp")).resolves.toMatchObject({ height: 120 });
    await expect(
      opened.reader.getUpdates(RIPPLE_PORTFOLIO, { network: "xrp" }),
    ).resolves.toMatchObject({ items: [{ accountId: RIPPLE_ACCOUNT_ID, txHash: "in-hash" }] });
  });

  it("writes without the service, even when it fails", async () => {
    const remote = fakeRemote({ error: new PortfolioApiError("INTERNAL_ERROR", "service down") });
    const opened = await openAccountPortfolio(rippleSource(), deps(), "write");

    await expect(
      opened.portfolio.estimateTransactionFee("xrp", {
        intent: { type: "send", sender: ADDRESS, recipient: "rOther", amount: "1" },
      }),
    ).resolves.toEqual({ value: "12", parameters: { reserve: "10" } });
    expect(remote.getPortfolio).not.toHaveBeenCalled();
  });
});
