import BigNumber from "bignumber.js";
import { toJsonOperation } from "@ledgerhq/account-module-framework";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { UnexpectedGetBalanceError } from "@ledgerhq/coin-module-framework/errors";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { NetworkDown } from "@ledgerhq/live-network/errors";
import { log } from "@ledgerhq/logs";
import type { PortfolioApi } from "@ledgerhq/portfolio-module-framework";
import { createLocalPortfolio } from "@ledgerhq/portfolio-module-local";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import type { SyncConfig } from "@ledgerhq/types-live";
import { CurrencyRegionRestrictedError } from "../../../errors";
import type { AssembledAccountShape } from "../assembly";
import { tokensSyncHash } from "../assembly/syncHash";
import {
  accountOperation,
  ADDRESS,
  ADDRESS_PATH,
  BITCOIN_ACCOUNT_ID,
  bitcoin,
  bitcoinAccount,
  coinOperation,
  fakeAccountModule,
  fakeBinding,
  fakeCoinModule,
  listingFrom,
  liveOperation,
  mockLiveConfig,
  portfolioCoinConfig,
  ripple,
  RIPPLE_ACCOUNT_ID,
  rippleAccount,
  XPUB,
  type FakeCoinModule,
} from "../tests/portfolioFixtures";
import { portfolioSyncHash } from "./account";
import { allItems, getPortfolioAccountShape, successItems } from "./shape";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));
jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));
jest.mock("@ledgerhq/portfolio-module-local", () => {
  const actual = jest.requireActual("@ledgerhq/portfolio-module-local");
  return {
    ...actual,
    // Every method of the local side a mock calling through, to tell how it is read.
    createLocalPortfolio: jest.fn((config: unknown) =>
      Object.fromEntries(
        Object.entries(actual.createLocalPortfolio(config)).map(([name, method]) => [
          name,
          jest.fn(method as (...args: unknown[]) => unknown),
        ]),
      ),
    ),
  };
});

const context = { config: async () => ({}), logger: () => undefined } as never;
const RIPPLE_PORTFOLIO = `ledger-wallet:${RIPPLE_ACCOUNT_ID}`;
const BITCOIN_PORTFOLIO = `ledger-wallet:${BITCOIN_ACCOUNT_ID}`;
/** The path a sync passes: the seed identifier path, not the address path. */
const SEED_PATH = "44'/144'/0'";
const SYNC: SyncConfig = { paginationConfig: {} };
const native = { type: "native" } as const;

/** A scan of the ripple account at ADDRESS_PATH. */
const rippleInfo = (fields: Partial<AccountShapeInfo> = {}): AccountShapeInfo => ({
  currency: ripple,
  address: ADDRESS,
  index: 0,
  derivationPath: ADDRESS_PATH,
  derivationMode: "",
  ...fields,
});

/** A sync of `initialAccount`, as `makeSync` asks for it. */
const rippleSync = (initialAccount = rippleAccount()): AccountShapeInfo =>
  rippleInfo({
    address: initialAccount.freshAddress,
    index: initialAccount.index,
    derivationPath: SEED_PATH,
    initialAccount,
  });

const bitcoinInfo = (fields: Partial<AccountShapeInfo> = {}): AccountShapeInfo => ({
  currency: bitcoin,
  address: "bc1qfirst",
  index: 0,
  derivationPath: "84'/0'",
  derivationMode: "native_segwit",
  deviceId: "device",
  ...fields,
});

type Mode = "local" | "hybrid" | "remote";

function configure(mode: Mode, url = "https://portfolio.test"): void {
  mockLiveConfig({
    config_portfolio_service: { url },
    config_currency_ripple: portfolioCoinConfig(mode),
    config_currency_bitcoin: portfolioCoinConfig(mode),
  });
}

/** The `syncHash` a read gives a ripple account, without blacklisted tokens. */
const syncHashOf = async (mode: Mode, bridgeApi: Partial<BridgeApi> = {}) =>
  portfolioSyncHash(mode, await tokensSyncHash("ripple", SYNC, bridgeApi));

const keyed = (xpubOrAddress: string) =>
  encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "ripple",
    xpubOrAddress,
    derivationMode: "",
  });

const opId = (hash: string, type: string) => encodeOperationId(RIPPLE_ACCOUNT_ID, hash, type);

const update = (hash: string, fields: Parameters<typeof accountOperation>[0] = {}) => ({
  network: "xrp",
  accountId: RIPPLE_ACCOUNT_ID,
  operation: toJsonOperation(
    accountOperation({ id: `${hash}-IN`, hash, type: "IN", details: {}, ...fields }),
  ),
  time: "2026-10-01T10:00:00.000Z",
  txHash: hash,
});

const entry = (amount: string, fields = {}) => ({
  network: "xrp",
  account_id: RIPPLE_ACCOUNT_ID,
  asset: "native",
  name: "XRP",
  ticker: "XRP",
  decimals: 6,
  amount,
  estimated: false,
  status: "confirmed",
  locked: false,
  ...fields,
});

const synchronizedService = {
  id: RIPPLE_PORTFOLIO,
  registrations: [{ type: "static", id: "s", network: "xrp", addresses: [ADDRESS] }],
  accounts: [{ id: RIPPLE_ACCOUNT_ID, network: "xrp", status: "synchronized" }],
};

/** The portfolio-service, the account registered and synchronized; `fields` override its answers. */
function serviceAnswering(fields: Partial<Record<keyof PortfolioApi, jest.Mock>>) {
  const service = {
    getPortfolio: jest.fn(async () => synchronizedService),
    getLastBlock: jest.fn(async () => ({ height: 150 })),
    getUpdates: jest.fn(async () => ({ items: [] })),
    getPortfolioBalance: jest.fn(async () => ({ items: [] })),
    getValidators: jest.fn(async () => ({ items: [] })),
    ...fields,
  };
  (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);
  return service;
}

/** The local side the last shape read. */
const lastLocal = (): Record<keyof PortfolioApi, jest.Mock> =>
  (createLocalPortfolio as jest.Mock).mock.results.at(-1)?.value;

let coinModule: FakeCoinModule;

const deps = (bridgeApi: Partial<BridgeApi> = {}, fields = {}) => ({
  bridgeApi: bridgeApi as BridgeApi,
  coinModuleApi: coinModule as never,
  context,
  signer: undefined,
  ...fields,
});

beforeEach(() => {
  jest.clearAllMocks();
  coinModule = fakeCoinModule();
});

afterEach(() => jest.restoreAllMocks());

describe("allItems", () => {
  it("follows the pages to the end, a page without items counting as empty", async () => {
    const read = jest
      .fn()
      .mockResolvedValueOnce({ items: [1, 2], nextToken: "p2" })
      .mockResolvedValueOnce({ nextToken: "p3" })
      .mockResolvedValueOnce({ items: [3], nextToken: "" });

    await expect(allItems(read)).resolves.toEqual([1, 2, 3]);
    expect(read.mock.calls).toEqual([[undefined], ["p2"], ["p3"]]);
  });

  it("stops on a token it already followed", async () => {
    const read = jest
      .fn()
      .mockResolvedValueOnce({ items: [1], nextToken: "p2" })
      .mockResolvedValue({ items: [2], nextToken: "p2" });

    await expect(allItems(read)).resolves.toEqual([1, 2]);
    expect(read).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(
      "generic-coin-framework",
      "portfolio read stopped on a page token already followed",
      { token: "p2" },
    );
  });
});

describe("successItems", () => {
  it("is the entries of every account read, none for an account answering none", () => {
    const success = { type: "success", network: "xrp", account_id: "a" } as const;
    expect(
      successItems([
        { ...success, items: [entry("1")] as never },
        success,
        { ...success, items: [entry("2")] as never },
      ]).map(({ amount }) => amount),
    ).toEqual(["1", "2"]);
  });

  it("fails for an account whose balances failed", () => {
    expect(() =>
      successItems([{ type: "failure", network: "xrp", account_id: "a", error: "lagging" }]),
    ).toThrow("lagging");
  });
});

describe("getPortfolioAccountShape of a single-address account", () => {
  it("scans the account through the local side, assembled as the legacy path assembles it", async () => {
    configure("local");
    const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps());

    expect(shape).toEqual({
      id: RIPPLE_ACCOUNT_ID,
      xpub: ADDRESS,
      // The first native balance: 700 spendable and 300 locked. No token is in the catalog.
      balance: new BigNumber(1_000),
      spendableBalance: new BigNumber(700),
      operations: [
        expect.objectContaining({
          id: opId("in-hash", "IN"),
          hash: "in-hash",
          type: "IN",
          value: new BigNumber(500),
          fee: new BigNumber(10),
          blockHeight: 110,
          blockHash: "block-110",
          accountId: RIPPLE_ACCOUNT_ID,
          hasFailed: false,
        }),
      ],
      operationsCount: 1,
      subAccounts: [],
      blockHeight: 120,
      syncHash: await syncHashOf("local"),
    });
    // Legacy sets no fresh address for an address family: jsHelpers keeps the account's own.
    expect(shape).not.toHaveProperty("freshAddress");
    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 0,
      cursor: undefined,
      order: "desc",
    });
    // The local side is read in one page, every asset's operations included.
    const size = Number.MAX_SAFE_INTEGER;
    expect(lastLocal().getUpdates.mock.calls).toEqual([
      [RIPPLE_PORTFOLIO, { network: "xrp", order: "DESC", size }],
    ]);
    expect(lastLocal().getPortfolioBalance.mock.calls).toEqual([
      [RIPPLE_PORTFOLIO, { network: "xrp", size }],
    ]);
    // Nothing else the family reads.
    expect(lastLocal().getValidators).not.toHaveBeenCalled();
    expect(lastLocal().getAccountInfo).not.toHaveBeenCalled();
  });

  it("keeps the address path of the account on a sync, which passes the seed identifier path", async () => {
    configure("local");
    const initialAccount = rippleAccount({ index: 2, freshAddressPath: "44'/144'/2'/0/0" });

    await getPortfolioAccountShape(rippleSync(initialAccount), SYNC, deps());

    await expect(lastLocal().getFreshAddress(RIPPLE_PORTFOLIO, RIPPLE_ACCOUNT_ID)).resolves.toEqual(
      { address: ADDRESS, derivation_path: "44'/144'/2'/0/0" },
    );
  });

  it("resumes an account it synced above its newest operations, reading back none it seeded", async () => {
    configure("local");
    const initialAccount = rippleAccount({
      blockHeight: 100,
      syncHash: await syncHashOf("local"),
      operations: [liveOperation()],
      pendingOperations: [liveOperation({ hash: "sent", type: "OUT", date: new Date() })],
    });

    const shape = await getPortfolioAccountShape(rippleSync(initialAccount), SYNC, deps());

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 91,
      cursor: undefined,
      order: "desc",
    });
    // The account's own copy of what it held, and what this sync listed.
    expect(shape.operations?.map(({ id }) => id)).toEqual([opId("in-hash", "IN"), "op"]);
    expect(shape.operations?.[1]).toBe(initialAccount.operations[0]);
    expect(shape.operationsCount).toBe(2);
  });

  it.each([
    ["the legacy path synced", "legacy-hash"],
    ["synced in another mode", "portfolio-hybrid-…"],
  ])("lists from scratch an account %s", async (_, syncHash) => {
    configure("local");
    const initialAccount = rippleAccount({
      blockHeight: 100,
      syncHash,
      operations: [liveOperation()],
    });

    const shape = await getPortfolioAccountShape(rippleSync(initialAccount), SYNC, deps());

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 0,
      cursor: undefined,
      order: "desc",
    });
    expect(shape).toMatchObject({ syncHash: await syncHashOf("local"), operationsCount: 1 });
  });

  it("versions the syncHash as the legacy path does, by the blacklisted tokens and the family's version", async () => {
    configure("local");
    const bridgeApi = { syncVersion: "2" };
    const blacklisted = { ...SYNC, blacklistedTokenIds: ["ripple/token/usd"] };

    const shape = await getPortfolioAccountShape(rippleInfo(), blacklisted, deps(bridgeApi));

    expect(shape.syncHash).toBe(
      portfolioSyncHash("local", await tokensSyncHash("ripple", blacklisted, bridgeApi)),
    );
    expect(shape.syncHash).not.toBe(await syncHashOf("local", bridgeApi));
    expect(shape.syncHash).toMatch(/^portfolio-local-0x[0-9a-f]+-2$/);
  });

  it("keys a family keyed on the public key by the key a scan reads, by its stored id otherwise", async () => {
    configure("local");
    const bridgeApi = { accountIdFromPublicKey: true };

    await expect(
      getPortfolioAccountShape(rippleInfo({ rest: { publicKey: "02pub" } }), SYNC, deps(bridgeApi)),
    ).resolves.toMatchObject({ id: keyed("02pub"), xpub: "02pub" });
    await expect(
      getPortfolioAccountShape(rippleInfo(), SYNC, deps(bridgeApi)),
    ).resolves.toMatchObject({ id: keyed(ADDRESS) });
    const initialAccount = rippleAccount({ id: keyed("02stored") });
    await expect(
      getPortfolioAccountShape(
        rippleInfo({ initialAccount, rest: { publicKey: "02pub" } }),
        SYNC,
        deps(bridgeApi),
      ),
    ).resolves.toMatchObject({ id: keyed("02stored") });
  });

  it("keeps the extended public key of the account, unless the derivation shares it", async () => {
    configure("local");
    const initialAccount = rippleAccount({ xpub: "02stored" });

    await expect(
      getPortfolioAccountShape(rippleSync(initialAccount), SYNC, deps()),
    ).resolves.toMatchObject({ xpub: "02stored" });
    const shared = await getPortfolioAccountShape(
      rippleInfo({ derivationMode: "solanaMain", rest: { publicKey: "02pub" } }),
      SYNC,
      deps({ addressLookup: {} as never }),
    );
    expect(shared).toHaveProperty("xpub", undefined);
  });

  describe("of a network reporting stakes", () => {
    const stake = {
      uid: "stake",
      address: "stake-account",
      state: "active",
      actions: [],
      asset: native,
      amount: 400n,
    };

    it("takes the account's own balance from the network's first native one, as legacy", async () => {
      configure("local");
      coinModule.getBalance.mockResolvedValue([
        { value: 1_000n, locked: 450n, asset: native },
        { value: 400n, asset: native, stake },
      ] as never);

      const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps());

      expect(shape).toMatchObject({
        balance: new BigNumber(1_000),
        spendableBalance: new BigNumber(550),
        stakingResources: { delegatedBalance: new BigNumber(400) },
      });
      await expect(
        getPortfolioAccountShape(rippleInfo(), SYNC, deps({ partitionsNativeBalance: true })),
      ).resolves.toMatchObject({
        balance: new BigNumber(1_400),
        spendableBalance: new BigNumber(950),
      });
    });

    it("counts a main balance carrying its own stake (hedera staked to a node)", async () => {
      configure("local");
      coinModule.getBalance.mockResolvedValue([
        { value: 1_000n, asset: native, stake: { ...stake, amount: 1_000n } },
      ] as never);

      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).resolves.toMatchObject({
        balance: new BigNumber(1_000),
        spendableBalance: new BigNumber(1_000),
      });
    });

    it("counts the locked part of a staked main balance out of the spendable one (stacks stacking)", async () => {
      configure("local");
      coinModule.getBalance.mockResolvedValue([
        { value: 1_000n, locked: 400n, asset: native, stake: { ...stake, amount: 1_000n } },
        { value: 300n, asset: native, stake: { ...stake, uid: "other", amount: 300n } },
      ] as never);

      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).resolves.toMatchObject({
        balance: new BigNumber(1_000),
        spendableBalance: new BigNumber(600),
      });
    });

    it("reads the validators through the portfolio, a failure reading none", async () => {
      configure("local");
      coinModule.getBalance.mockResolvedValue([{ value: 400n, asset: native, stake }] as never);
      const getValidators = jest.fn(async () => ({
        items: [{ address: "val", name: "Val", balance: 9n, commissionRate: "0.1", apy: 0.05 }],
      }));
      coinModule = fakeCoinModule({ ...coinModule, getValidators });
      const bridgeApi = { stakingSupported: true };

      const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps(bridgeApi));

      expect(shape).toMatchObject({
        stakingResources: {
          validators: [
            {
              validatorAddress: "val",
              name: "Val",
              commission: 0.1,
              tokens: "9",
              votingPower: 0,
              estimatedYearlyRewardsRate: 0.05,
            },
          ],
        },
      });
      getValidators.mockRejectedValue(new Error("validators down"));
      const failed = await getPortfolioAccountShape(rippleInfo(), SYNC, deps(bridgeApi));
      expect(failed).toMatchObject({ stakingResources: { delegations: [expect.anything()] } });
      expect((failed as AssembledAccountShape).stakingResources).not.toHaveProperty("validators");
    });
  });

  it("lists the operations this sync read as the legacy path does: NFT and failed incoming left out, internal ones under their parent", async () => {
    configure("local");
    const tx = coinOperation().tx;
    coinModule.listOperations.mockResolvedValue({
      items: [
        coinOperation(),
        coinOperation({
          id: "fee-paid",
          type: "OUT",
          value: 5n,
          tx: { ...tx, hash: "out-hash", feesPayer: "rSponsor" },
        }),
        coinOperation({
          id: "internal-op",
          details: { internal: true },
          tx: { ...tx, hash: "out-hash" },
        }),
        coinOperation({
          id: "nft-op",
          details: { ledgerOpType: "NFT_IN" },
          tx: { ...tx, hash: "nft-hash" },
        }),
        coinOperation({ id: "failed-in", tx: { ...tx, hash: "failed-hash", failed: true } }),
      ],
    } as never);

    const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps());

    expect(
      shape.operations?.map(({ hash, type, value }) => [hash, type, value.toNumber()]),
    ).toEqual([
      ["in-hash", "IN", 500],
      ["out-hash", "OUT", 15],
    ]);
    expect(shape.operations?.[1].internalOperations).toEqual([
      expect.objectContaining({ hash: "out-hash", type: "IN" }),
    ]);
  });

  it("revives the family bag and the stake amount of the operations as the legacy path does", async () => {
    configure("local");
    const reviveFamilyExtra = jest.fn(extra => ({ ...extra, revived: true }));
    coinModule.listOperations.mockResolvedValue({
      items: [
        coinOperation({
          type: "DELEGATE",
          details: {
            familyExtra: { consensusTimestamp: "123.456" },
            stake: { address: "stake-account", amount: 777n },
            memo: "hello",
          },
        }),
      ],
    } as never);

    const shape = await getPortfolioAccountShape(
      rippleInfo(),
      SYNC,
      deps({}, { reviveFamilyExtra }),
    );

    expect(shape.operations?.[0].extra).toEqual({
      consensusTimestamp: "123.456",
      revived: true,
      memo: "hello",
      stake: { address: "stake-account", amount: new BigNumber(777) },
    });
  });

  it("builds the token accounts from the catalog lookup the local side shares", async () => {
    configure("local");
    const token = {
      type: "TokenCurrency",
      id: "ripple/token/usd",
      contractAddress: "USD.rIssuer",
      name: "US Dollar",
      ticker: "USD",
      units: [{ name: "USD", code: "USD", magnitude: 2 }],
      parentCurrency: ripple,
    };
    const getTokenFromAsset = jest.fn(async (asset: AssetInfo) =>
      (asset as { assetReference?: string }).assetReference === "USD.rIssuer"
        ? (token as never)
        : undefined,
    );

    const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps({ getTokenFromAsset }));

    expect(shape.subAccounts).toEqual([
      expect.objectContaining({ token, balance: new BigNumber(5), parentId: RIPPLE_ACCOUNT_ID }),
    ]);
    // The local side resolved the asset for its entries, the shape reused the answer.
    expect(getTokenFromAsset).toHaveBeenCalledTimes(1);
  });

  describe("of a family adding its own fields", () => {
    const tronResources = { energy: 0 };

    it("adds the fields the family builds from the account info the portfolio reads", async () => {
      configure("local");
      const info = { type: "tron", activated: true, big: 5n };
      const getAccountInfo = jest.fn(async () => info);
      coinModule = fakeCoinModule({ getAccountInfo });
      const buildAccountShape = jest.fn(async () => ({ tronResources }));

      const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps({ buildAccountShape }));

      expect(shape).toMatchObject({ tronResources, id: RIPPLE_ACCOUNT_ID });
      expect(getAccountInfo).toHaveBeenCalledWith(context, ADDRESS);
      // The JSON form, as on the legacy path.
      expect(buildAccountShape).toHaveBeenCalledWith(ADDRESS, {
        type: "tron",
        activated: true,
        big: "5",
      });
    });

    it("builds them from no account info when the coin module has none", async () => {
      configure("local");
      const buildAccountShape = jest.fn(() => ({ tronResources }));

      await expect(
        getPortfolioAccountShape(rippleInfo(), SYNC, deps({ buildAccountShape })),
      ).resolves.toMatchObject({ tronResources });
      expect(buildAccountShape).toHaveBeenCalledWith(ADDRESS, { type: "none" });
    });

    it("keeps the stored ones where the portfolio serves no account info (remote)", async () => {
      configure("remote");
      serviceAnswering({});
      const buildAccountShape = jest.fn(() => ({ tronResources }));

      const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps({ buildAccountShape }));

      expect(shape).not.toHaveProperty("tronResources");
      expect(buildAccountShape).not.toHaveBeenCalled();
    });

    it("fails the sync when the family fails to build them", async () => {
      configure("local");
      const down = new Error("tron node down");
      const buildAccountShape = jest.fn(async () => Promise.reject(down));

      await expect(
        getPortfolioAccountShape(rippleInfo(), SYNC, deps({ buildAccountShape })),
      ).rejects.toBe(down);
    });
  });

  describe("of a family telling the readiness of its accounts", () => {
    it("tells it, the hook reading the chain through the portfolio only", async () => {
      configure("local");
      const readiness = { ready: false, reason: "activationRequired" };
      const getAccountReadiness = jest.fn(async (_c, _a, chain) => {
        await chain.getAccountInfo(ADDRESS);
        return readiness;
      });

      await expect(
        getPortfolioAccountShape(rippleInfo(), SYNC, deps({ getAccountReadiness })),
      ).resolves.toMatchObject({ readiness });
      expect(getAccountReadiness).toHaveBeenCalledWith(ripple, ADDRESS, {
        getAccountInfo: expect.any(Function),
        call: expect.any(Function),
        getNextSequence: expect.any(Function),
        getAddressesForPublicKey: expect.any(Function),
        getTransactionInfo: expect.any(Function),
      });
      expect(lastLocal().getAccountInfo).toHaveBeenCalledWith("xrp", ADDRESS);
    });

    it("leaves the account's own when the lookup fails", async () => {
      configure("local");
      const getAccountReadiness = jest.fn(async () => Promise.reject(new Error("lookup down")));

      const shape = await getPortfolioAccountShape(
        rippleInfo(),
        SYNC,
        deps({ getAccountReadiness }),
      );

      expect(shape).not.toHaveProperty("readiness");
      expect(log).toHaveBeenCalledWith(
        "generic-coin-framework",
        "getAccountReadiness failed, leaving readiness undefined",
        { error: "lookup down" },
      );
    });
  });

  describe("failing a sync", () => {
    beforeEach(() => configure("local"));

    it("fails as the module failed, revived from what the portfolio tells", async () => {
      coinModule.lastBlock.mockRejectedValue(new Error("node down"));
      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).rejects.toThrow(
        "node down",
      );

      coinModule.lastBlock.mockResolvedValue({ height: 1, hash: "", time: new Date() });
      coinModule.getBalance.mockRejectedValue(new NetworkDown("offline"));
      const failure = await getPortfolioAccountShape(rippleInfo(), SYNC, deps()).catch(e => e);
      expect(failure).toBeInstanceOf(UnexpectedGetBalanceError);
      expect(failure.cause).toBeInstanceOf(NetworkDown);
    });

    it("fails as region restricted when the currency checks it and the region refuses its balance", async () => {
      coinModule.getBalance.mockRejectedValue(Object.assign(new Error("blocked"), { status: 405 }));
      const checking = { config: async () => ({ checkRegionRestriction: true }) } as never;

      await expect(
        getPortfolioAccountShape(rippleInfo(), SYNC, deps({}, { context: checking })),
      ).rejects.toBeInstanceOf(CurrencyRegionRestrictedError);
      // Not on another read, as on the legacy path.
      coinModule.getBalance.mockResolvedValue([]);
      coinModule.lastBlock.mockRejectedValue(Object.assign(new Error("blocked"), { status: 405 }));
      await expect(
        getPortfolioAccountShape(rippleInfo(), SYNC, deps({}, { context: checking })),
      ).rejects.not.toBeInstanceOf(CurrencyRegionRestrictedError);
    });
  });

  describe("in remote mode", () => {
    beforeEach(() => configure("remote"));

    it("reads every page the service serves, assembled as on the local side", async () => {
      const service = serviceAnswering({
        getPortfolioBalance: jest
          .fn()
          .mockResolvedValueOnce({
            items: [
              {
                type: "success",
                network: "xrp",
                account_id: RIPPLE_ACCOUNT_ID,
                items: [
                  entry("400"),
                  entry("100", { locked: true }),
                  entry("9", { asset: "USD.rIssuer" }),
                ],
              },
            ],
            nextToken: "balances-2",
          })
          .mockResolvedValueOnce({
            items: [{ type: "success", network: "xrp", account_id: RIPPLE_ACCOUNT_ID }],
          }),
        getUpdates: jest
          .fn()
          .mockResolvedValueOnce({
            items: [update("first", { date: new Date("2026-10-02T10:00:00Z") })],
            nextToken: "updates-2",
          })
          .mockResolvedValueOnce({
            items: [update("second"), update("pending", { optimistic: true, block: null })],
          }),
      });

      const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps());

      expect(service.getPortfolioBalance.mock.calls).toEqual([
        [RIPPLE_PORTFOLIO, { network: "xrp" }],
        [RIPPLE_PORTFOLIO, { network: "xrp", token: "balances-2" }],
      ]);
      expect(service.getUpdates.mock.calls).toEqual([
        [RIPPLE_PORTFOLIO, { network: "xrp", order: "DESC" }],
        [RIPPLE_PORTFOLIO, { network: "xrp", order: "DESC", token: "updates-2" }],
      ]);
      expect(service.getLastBlock).toHaveBeenCalledWith("xrp");
      expect(shape).toMatchObject({
        id: RIPPLE_ACCOUNT_ID,
        balance: new BigNumber(500),
        spendableBalance: new BigNumber(400),
        operationsCount: 2,
        blockHeight: 150,
        syncHash: await syncHashOf("remote"),
      });
      expect(shape.operations?.map(({ hash }) => hash)).toEqual(["first", "second"]);
      // Nothing is synced on the client in remote mode.
      expect(coinModule.lastBlock).not.toHaveBeenCalled();
    });

    it("reads an operation the service answers in no block at height 0", async () => {
      serviceAnswering({
        getUpdates: jest.fn(async () => ({
          items: [update("confirmed"), update("unconfirmed", { block: null })],
        })),
      });

      const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps());

      expect(shape.operations?.map(({ hash, blockHeight }) => [hash, blockHeight])).toEqual([
        ["confirmed", 790],
        ["unconfirmed", 0],
      ]);
    });

    it("reads the first page of the service's validators, which may hold none", async () => {
      const service = serviceAnswering({ getValidators: jest.fn(async () => ({})) });

      const shape = await getPortfolioAccountShape(
        rippleInfo(),
        SYNC,
        deps({ stakingSupported: true }),
      );

      expect(service.getValidators).toHaveBeenCalledWith("xrp", undefined);
      expect((shape as AssembledAccountShape).stakingResources).not.toHaveProperty("validators");
    });

    it("fails when the service could not read the balances of the account", async () => {
      serviceAnswering({
        getPortfolioBalance: jest.fn(async () => ({
          items: [
            {
              type: "failure",
              network: "xrp",
              account_id: RIPPLE_ACCOUNT_ID,
              error: "indexer lagging",
            },
          ],
        })),
      });
      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).rejects.toThrow(
        "indexer lagging",
      );
    });

    it("logs a failure the service tells, its reads still answering", async () => {
      serviceAnswering({
        getPortfolio: jest.fn(async () => ({
          ...synchronizedService,
          accounts: [
            {
              id: RIPPLE_ACCOUNT_ID,
              network: "xrp",
              status: "synchronized",
              error: { name: "Error", message: "indexer behind" },
            },
          ],
        })),
      });

      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).resolves.toMatchObject({
        blockHeight: 0,
      });
      expect(log).toHaveBeenCalledWith(
        "generic-coin-framework",
        "The local twin of a xrp account failed to sync",
        { error: expect.objectContaining({ message: "indexer behind" }) },
      );
    });

    it("fails with UNAVAILABLE while the service has not synchronized the account", async () => {
      serviceAnswering({
        getPortfolio: jest.fn(async () => ({
          ...synchronizedService,
          accounts: [{ id: RIPPLE_ACCOUNT_ID, network: "xrp", status: "uninitialized" }],
        })),
      });
      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).rejects.toMatchObject({
        type: "UNAVAILABLE",
      });
    });

    it("fails with UNAVAILABLE without a service url", async () => {
      configure("remote", "");
      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).rejects.toMatchObject({
        type: "UNAVAILABLE",
      });
    });
  });

  describe("in hybrid mode", () => {
    beforeEach(() => configure("hybrid"));

    it("reads the service, the hidden local twin synced beside it", async () => {
      const service = serviceAnswering({
        getPortfolioBalance: jest.fn(async () => ({
          items: [
            {
              type: "success",
              network: "xrp",
              account_id: RIPPLE_ACCOUNT_ID,
              items: [entry("800")],
            },
          ],
        })),
      });
      coinModule.lastBlock.mockRejectedValue(new Error("node down"));

      const shape = await getPortfolioAccountShape(rippleInfo(), SYNC, deps());

      expect(shape).toMatchObject({
        balance: new BigNumber(800),
        syncHash: await syncHashOf("hybrid"),
      });
      expect(service.getUpdates).toHaveBeenCalledWith(RIPPLE_PORTFOLIO, {
        network: "xrp",
        order: "DESC",
      });
      // The twin is synced, its failure hidden with it: the service answers the reads.
      expect(coinModule.lastBlock).toHaveBeenCalled();
    });

    it("reads the local twin until the service has synchronized the account, failing with it", async () => {
      serviceAnswering({
        getPortfolio: jest.fn(async () => ({ ...synchronizedService, accounts: [] })),
      });

      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).resolves.toMatchObject({
        balance: new BigNumber(1_000),
        blockHeight: 120,
      });

      coinModule.lastBlock.mockRejectedValue(new Error("node down"));
      await expect(getPortfolioAccountShape(rippleInfo(), SYNC, deps())).rejects.toThrow(
        "node down",
      );
    });
  });
});

describe("getPortfolioAccountShape of an account module account", () => {
  beforeEach(() => configure("local"));

  const utxo = {
    txid: "t",
    vout: 0,
    value: 1n,
    address: "a",
    derivationPath: "84'/0'/0'/0/1",
    height: null,
    replaceable: false,
    change: false,
  };

  it("scans an account from the key read on the device, with the fields legacy gives it", async () => {
    const module = fakeAccountModule();
    (module as { getUTXOs?: unknown }).getUTXOs = jest.fn(async () => ({ value: [utxo] }));
    const toLiveOperation = jest.fn((_op, live) => ({ ...live, completed: true }));
    const syncedHeight = jest.fn(() => 790);
    const binding = fakeBinding(module, { toLiveOperation, syncedHeight });
    const signer = { getAddress: jest.fn(), context: jest.fn() };

    const shape = await getPortfolioAccountShape(bitcoinInfo(), SYNC, {
      bridgeApi: { accountModule: binding },
      coinModuleApi: coinModule as never,
      context,
      signer,
    });

    expect(binding.getAccountKey).toHaveBeenCalledWith(
      {
        currencyId: "bitcoin",
        derivationPath: "84'/0'/0'",
        derivationMode: "native_segwit",
        deviceId: "device",
      },
      signer.context,
    );
    expect(shape).toEqual({
      id: BITCOIN_ACCOUNT_ID,
      balance: new BigNumber(900),
      spendableBalance: new BigNumber(800),
      operations: [
        expect.objectContaining({
          id: encodeOperationId(BITCOIN_ACCOUNT_ID, "synced", "OUT"),
          value: new BigNumber(2_000),
          extra: { inputs: ["prev-0"] },
          completed: true,
        }),
      ],
      operationsCount: 1,
      freshAddress: "bc1qfresh",
      freshAddressPath: "84'/0'/0'/0/5",
      blockHeight: 790,
      xpub: XPUB,
    });
    // The family fields are read on the state the sync just persisted in Ledger Wallet's store.
    const state = { version: 1, data: { balance: "900", locked: "100" } };
    expect(syncedHeight).toHaveBeenCalledWith(state);
    expect(binding.accountFields).toHaveBeenCalledWith({
      key: XPUB,
      state,
      getUTXOs: expect.any(Function),
    });
    const [{ getUTXOs }] = binding.accountFields.mock.calls[0];
    const { derivationPath: _, ...read } = utxo;
    await expect(getUTXOs()).resolves.toEqual([read]);
    // No tip read: the module tells the height it synced at.
    expect(lastLocal().getLastBlock).not.toHaveBeenCalled();
  });

  it("reads the operations newest first, as the module's history orders them", async () => {
    const module = fakeAccountModule();
    module.sync.mockImplementation(async function* (_context, { history, state }) {
      await history.upsert([
        accountOperation({ id: "a-OUT", hash: "a" }),
        accountOperation({ id: "b-IN", hash: "b", type: "IN" }),
        accountOperation({ id: "older", hash: "older", date: new Date("2026-01-01") }),
        accountOperation({ id: "sent", hash: "sent", optimistic: true, block: null }),
      ]);
      await state.put({ version: 1, data: {} });
      yield { progress: {} };
    });
    const binding = fakeBinding(module);

    const shape = await getPortfolioAccountShape(
      bitcoinInfo({ initialAccount: bitcoinAccount() }),
      SYNC,
      {
        bridgeApi: { accountModule: binding },
        coinModuleApi: coinModule as never,
        context,
        signer: undefined,
      },
    );

    expect(shape.operations?.map(({ hash }) => hash)).toEqual(["a", "b", "older"]);
    expect(shape).toMatchObject({ balance: new BigNumber(0), spendableBalance: new BigNumber(0) });
    expect(shape).not.toHaveProperty("blockHeight");
  });

  it("gives no outputs when the module keeps none, and fails as the read fails otherwise", async () => {
    const module = fakeAccountModule();
    const binding = fakeBinding(module);
    const deps = {
      bridgeApi: { accountModule: binding },
      coinModuleApi: coinModule as never,
      context,
      signer: undefined,
    };

    await getPortfolioAccountShape(bitcoinInfo({ initialAccount: bitcoinAccount() }), SYNC, deps);

    const [{ getUTXOs }] = binding.accountFields.mock.calls[0];
    await expect(getUTXOs()).resolves.toEqual([]);
    (module as { getUTXOs?: unknown }).getUTXOs = jest.fn(async () => {
      throw new Error("utxos down");
    });
    await expect(getUTXOs()).rejects.toThrow("utxos down");
  });

  it("syncs an account from the key of its id, without the device", async () => {
    const module = fakeAccountModule();
    const binding = fakeBinding(module);

    const shape = await getPortfolioAccountShape(
      bitcoinInfo({ index: 3, initialAccount: bitcoinAccount() }),
      SYNC,
      {
        bridgeApi: { accountModule: binding },
        coinModuleApi: coinModule as never,
        context,
        signer: undefined,
      },
    );

    expect(binding.getAccountKey).not.toHaveBeenCalled();
    expect(module.sync).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        descriptor: expect.objectContaining({ key: XPUB, index: 3, derivationPath: "84'/0'/3'" }),
      }),
      {},
    );
    expect(shape.id).toBe(BITCOIN_ACCOUNT_ID);
  });

  it("fails as its module failed, never as a region", async () => {
    const module = fakeAccountModule();
    module.sync.mockImplementation(async function* () {
      yield* [];
      throw new UnexpectedGetBalanceError("", Object.assign(new Error("blocked"), { status: 405 }));
    });
    const checking = { config: async () => ({ checkRegionRestriction: true }) } as never;

    const failure = await getPortfolioAccountShape(
      bitcoinInfo({ initialAccount: bitcoinAccount() }),
      SYNC,
      {
        bridgeApi: { accountModule: fakeBinding(module) },
        coinModuleApi: coinModule as never,
        context: checking,
        signer: undefined,
      },
    ).catch(e => e);

    expect(failure).toBeInstanceOf(UnexpectedGetBalanceError);
  });

  it("needs a signer to scan", async () => {
    await expect(
      getPortfolioAccountShape(bitcoinInfo(), SYNC, {
        bridgeApi: { accountModule: fakeBinding(fakeAccountModule()) },
        coinModuleApi: coinModule as never,
        context,
        signer: undefined,
      }),
    ).rejects.toThrow("No signer to scan bitcoin accounts");
  });

  it("reads the service in remote mode, the fresh address and outputs from the hidden local twin", async () => {
    configure("remote");
    const service = serviceAnswering({
      getPortfolio: jest.fn(async () => ({
        id: BITCOIN_PORTFOLIO,
        registrations: [{ type: "auto_derive", id: "s", network: "bitcoin", xpub: XPUB }],
        accounts: [{ id: "service-account", network: "bitcoin", status: "synchronized" }],
      })),
      getPortfolioBalance: jest.fn(async () => ({
        items: [
          {
            type: "success",
            network: "bitcoin",
            account_id: "service-account",
            items: [{ ...entry("1500"), network: "bitcoin" }],
          },
        ],
      })),
    });
    const module = fakeAccountModule();

    const shape = await getPortfolioAccountShape(
      bitcoinInfo({ initialAccount: bitcoinAccount() }),
      SYNC,
      {
        bridgeApi: { accountModule: fakeBinding(module) },
        coinModuleApi: coinModule as never,
        context,
        signer: undefined,
      },
    );

    expect(shape).toMatchObject({ balance: new BigNumber(1_500), freshAddress: "bc1qfresh" });
    expect(service.getPortfolioBalance).toHaveBeenCalledWith(BITCOIN_PORTFOLIO, {
      network: "bitcoin",
    });
    expect(module.sync).toHaveBeenCalled();
  });
});

describe("getPortfolioAccountShape over syncs", () => {
  it("keeps the family fields of the operations a resumed sync lists nothing new over", async () => {
    configure("local");
    const listed = coinOperation({
      details: { familyExtra: { transactionId: "0.0.1@1700000000.1" }, memo: "hello" },
    });
    const listOperations = listingFrom(listed);
    coinModule = fakeCoinModule({ listOperations });

    const first = await getPortfolioAccountShape(rippleInfo(), SYNC, deps());
    const synced = rippleAccount({ ...first });
    const second = await getPortfolioAccountShape(rippleSync(synced), SYNC, deps());

    expect(listOperations.mock.calls.map(([, , { minHeight }]) => minHeight)).toEqual([0, 111]);
    expect(first.operations?.[0].extra).toEqual({
      transactionId: "0.0.1@1700000000.1",
      memo: "hello",
    });
    expect(second.operations).toEqual(first.operations);
    expect(second.operations?.[0]).toBe(first.operations?.[0]);
  });
});
