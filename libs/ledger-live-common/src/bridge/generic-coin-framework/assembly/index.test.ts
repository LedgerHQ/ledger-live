import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi, ChainReads } from "@ledgerhq/ledger-wallet-framework/api/types";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, StakingResources, TokenAccount } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import type { OperationCommon } from "../types";
import { assembleAccountShape, type AssemblyTarget, type ChainSnapshot } from "./index";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const currency = getCryptoCurrencyById("ethereum");
const ADDRESS = "0xMe";
const ACCOUNT_ID = `js:2:ethereum:${ADDRESS}:`;
const SYNC_HASH = "0xtokens";

const chain: ChainReads = {
  getAccountInfo: jest.fn(),
  call: jest.fn(),
  getNextSequence: jest.fn(),
  getAddressesForPublicKey: jest.fn(),
  getTransactionInfo: jest.fn(),
};

const token = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usdc",
  contractAddress: "0xUSDC",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
  parentCurrencyId: "ethereum",
  tokenType: "erc20",
} as unknown as TokenCurrency;
const usdc = { type: "erc20", assetReference: "0xUSDC", assetOwner: ADDRESS };

const liveOp = (fields: Partial<OperationCommon> = {}): OperationCommon =>
  ({
    id: encodeOperationId(ACCOUNT_ID, fields.hash ?? "0xnew", fields.type ?? "IN"),
    hash: "0xnew",
    accountId: ACCOUNT_ID,
    type: "IN",
    value: new BigNumber(5),
    fee: new BigNumber(1),
    senders: ["0xother"],
    recipients: [ADDRESS],
    blockHash: "0xblock",
    blockHeight: 40,
    date: new Date("2026-01-02T00:00:00.000Z"),
    extra: {},
    ...fields,
  }) as OperationCommon;

const target = (fields: Partial<AssemblyTarget> = {}): AssemblyTarget => ({
  info: {
    currency,
    address: ADDRESS,
    index: 0,
    derivationPath: "44'/60'/0'/0/0",
    derivationMode: "",
  },
  syncConfig: { paginationConfig: {} },
  bridgeApi: {},
  chain,
  accountId: ACCOUNT_ID,
  syncHash: SYNC_HASH,
  ...fields,
});

const snapshot = (fields: Partial<ChainSnapshot> = {}): ChainSnapshot => ({
  balances: [{ value: 1000n, locked: 300n, asset: { type: "native" } }],
  newOperations: [],
  bounded: false,
  tipHeight: 50,
  validators: [],
  family: {},
  ...fields,
});

const storedAccount = (fields: Partial<Account> = {}): Account =>
  ({
    id: ACCOUNT_ID,
    blockHeight: 30,
    syncHash: SYNC_HASH,
    xpub: "stored-xpub",
    operations: [],
    pendingOperations: [],
    subAccounts: [],
    ...fields,
  }) as unknown as Account;

describe("assembleAccountShape", () => {
  beforeEach(() => jest.clearAllMocks());

  it("assembles an account synced from scratch: balances, operations, tokens and family fields", async () => {
    const tokenOp = liveOp({
      hash: "0xtoken",
      extra: {
        assetReference: "0xUSDC",
        assetOwner: ADDRESS,
        assetAmount: "7",
        ledgerOpType: "IN",
      },
    });
    const getTokenFromAsset = jest.fn(async () => token);

    const shape = await assembleAccountShape(
      target({ bridgeApi: { getTokenFromAsset } }),
      snapshot({
        balances: [
          { value: 1000n, locked: 300n, asset: { type: "native" } },
          { value: 7n, asset: usdc },
        ],
        newOperations: [liveOp(), tokenOp],
        family: {
          familyShape: { familyField: "family" },
          tokenShapes: { "0xUSDC": { tokenField: "token" } },
          readiness: { ready: false, reason: "unrevealed" },
        },
      }),
    );

    expect(getTokenFromAsset).toHaveBeenCalledWith(usdc);
    expect(shape).toMatchObject({
      familyField: "family",
      id: ACCOUNT_ID,
      xpub: ADDRESS,
      blockHeight: 50,
      balance: new BigNumber(1000),
      spendableBalance: new BigNumber(700),
      operationsCount: 2,
      syncHash: SYNC_HASH,
      readiness: { ready: false, reason: "unrevealed" },
      subAccounts: [
        {
          token,
          tokenField: "token",
          balance: new BigNumber(7),
          operations: [expect.objectContaining({ hash: "0xtoken", type: "IN" })],
        },
      ],
    });
    expect(shape.operations?.map(op => [op.hash, op.type])).toEqual([
      ["0xnew", "IN"],
      ["0xtoken", "NONE"],
    ]);
    expect(shape).not.toHaveProperty("stakingResources");
    expect(shape).not.toHaveProperty("stakingPositions");
  });

  it("looks the sub-account tokens up with the path's lookup when it brings one", async () => {
    const familyLookup = jest.fn(async () => undefined);
    const pathLookup = jest.fn(async () => token);

    const shape = await assembleAccountShape(
      target({ bridgeApi: { getTokenFromAsset: familyLookup }, getTokenFromAsset: pathLookup }),
      snapshot({ balances: [{ value: 7n, asset: usdc }] }),
    );

    expect(pathLookup).toHaveBeenCalledWith(usdc);
    expect(familyLookup).not.toHaveBeenCalled();
    expect(shape.subAccounts).toHaveLength(1);
    // No native balance listed: an empty one.
    expect(shape.balance).toEqual(new BigNumber(0));
    expect(shape.spendableBalance).toEqual(new BigNumber(0));
  });

  it("merges an incremental sync over the stored operations and sub-accounts", async () => {
    const stored = liveOp({ hash: "0xold", blockHeight: 30, accountId: "js:1:legacy" });
    const storedSub = {
      id: "sub",
      token,
      operations: [],
      pendingOperations: [{ hash: "pending-sub" }],
      swapHistory: [],
      balanceHistoryCache: {},
      creationDate: new Date("2020-01-01T00:00:00.000Z"),
    } as unknown as TokenAccount;

    const shape = await assembleAccountShape(
      target({
        info: {
          ...target().info,
          initialAccount: storedAccount({ operations: [stored], subAccounts: [storedSub] }),
        },
        bridgeApi: { getTokenFromAsset: async () => token },
      }),
      snapshot({ balances: [{ value: 7n, asset: usdc }], newOperations: [liveOp()] }),
    );

    expect(shape.xpub).toBe("stored-xpub");
    expect(shape.operations?.map(op => op.hash)).toEqual(["0xnew", "0xold"]);
    // A pre-framework operation is rewritten under the account id.
    expect(shape.operations?.[1]).toMatchObject({
      accountId: ACCOUNT_ID,
      id: encodeOperationId(ACCOUNT_ID, "0xold", "IN"),
    });
    expect(shape.subAccounts?.[0]).toMatchObject({
      pendingOperations: [{ hash: "pending-sub" }],
      creationDate: storedSub.creationDate,
    });
  });

  it("drops the stored operations of an account synced under another hash", async () => {
    const shape = await assembleAccountShape(
      target({
        info: {
          ...target().info,
          initialAccount: storedAccount({
            syncHash: "other",
            operations: [liveOp({ hash: "0xold" })],
          }),
        },
      }),
      snapshot({ newOperations: [] }),
    );

    expect(shape.operations).toEqual([]);
    // No operation: height 0.
    expect(shape.blockHeight).toBe(0);
  });

  it("keeps the stored height when the tip reads 0, and keeps a stored operation of the same id", async () => {
    const stored = liveOp({ hash: "0xold" });
    const shape = await assembleAccountShape(
      target({
        info: { ...target().info, initialAccount: storedAccount({ operations: [stored] }) },
      }),
      snapshot({ tipHeight: 0 }),
    );

    expect(shape.blockHeight).toBe(30);
    expect(shape.operations).toEqual([stored]);
  });

  it("refreshes the broadcast pending operations this sync did not list, through the chain reads", async () => {
    const confirmed = liveOp({ hash: "0xpending", blockHeight: 45 });
    const refreshOperations = jest.fn(async () => [confirmed]);
    const pending = [
      liveOp({ hash: "0xpending", blockHeight: null }),
      liveOp({ hash: "0xnew", blockHeight: null }),
      liveOp({ hash: "", blockHeight: null }),
    ];

    const shape = await assembleAccountShape(
      target({
        info: { ...target().info, initialAccount: storedAccount({ pendingOperations: pending }) },
        bridgeApi: { refreshOperations },
      }),
      snapshot({ newOperations: [liveOp()] }),
    );

    expect(refreshOperations).toHaveBeenCalledWith([pending[0]], chain);
    expect(shape.operations?.map(op => op.hash)).toEqual(["0xpending", "0xnew"]);
  });

  it("refreshes nothing when every pending operation was listed", async () => {
    const refreshOperations = jest.fn(async () => []);
    await assembleAccountShape(
      target({
        info: {
          ...target().info,
          initialAccount: storedAccount({ pendingOperations: [liveOp({ blockHeight: null })] }),
        },
        bridgeApi: { refreshOperations },
      }),
      snapshot({ newOperations: [liveOp()] }),
    );

    expect(refreshOperations).not.toHaveBeenCalled();
  });

  it("builds the parents from the operations the family adapted, internal ones attached", async () => {
    const internal = liveOp({ hash: "0xnew", type: "OUT", extra: { internal: true } });
    const adaptOperations = jest.fn((_address: string, operations: OperationCommon[]) => [
      ...operations,
      internal,
    ]);

    const shape = await assembleAccountShape(
      target({ bridgeApi: { adaptOperations } as Partial<BridgeApi> }),
      snapshot({ newOperations: [liveOp()] }),
    );

    expect(adaptOperations).toHaveBeenCalledWith(ADDRESS, [liveOp()]);
    expect(shape.operations).toHaveLength(1);
    expect(shape.operations?.[0].internalOperations).toEqual([internal]);
  });

  it("stores the sequence the family read", async () => {
    const withSequence = await assembleAccountShape(
      target(),
      snapshot({ family: { sequence: 9 } }),
    );
    expect(withSequence.sequence).toBe(9);

    expect(await assembleAccountShape(target(), snapshot())).not.toHaveProperty("sequence");
  });

  describe("operation history bound", () => {
    const tokenOp = (hash: string, blockHeight: number) =>
      liveOp({
        hash,
        blockHeight,
        date: new Date(Date.UTC(2026, 0, 1, 0, blockHeight)),
        extra: { assetReference: "0xUSDC", assetOwner: ADDRESS, assetAmount: "1" },
      });
    const storedSub = (operations: OperationCommon[]) =>
      ({
        id: "sub",
        type: "TokenAccount",
        token,
        operations,
        pendingOperations: [{ hash: "pending-sub" }],
        swapHistory: [{ swapId: "swap" }],
        balanceHistoryCache: {},
        creationDate: new Date("2020-01-01T00:00:00.000Z"),
      }) as unknown as TokenAccount;

    it("stores the newest operations of the account and of its token accounts, whole transactions", async () => {
      const shape = await assembleAccountShape(
        target({ bridgeApi: { getTokenFromAsset: async () => token }, maxOperations: 2 }),
        snapshot({
          balances: [{ value: 3n, asset: usdc }],
          newOperations: [
            liveOp({ hash: "0xself", type: "OUT", blockHeight: 49 }),
            liveOp({ hash: "0xself", type: "IN", blockHeight: 49 }),
            tokenOp("0xt3", 48),
            tokenOp("0xt2", 47),
            tokenOp("0xt1", 46),
          ],
        }),
      );

      // The self-send is two rows of one transaction: both stay, the bound reached on them.
      expect(shape.operations?.map(op => [op.hash, op.type])).toEqual([
        ["0xself", "OUT"],
        ["0xself", "IN"],
      ]);
      expect(shape.operationsCount).toBe(2);
      expect(shape.subAccounts?.[0].operations.map(op => op.hash)).toEqual(["0xt3", "0xt2"]);
    });

    it("links a stored parent to the token rows its token account still stores", async () => {
      const keptRow = tokenOp("0xkept", 20);
      const storedParent = liveOp({
        hash: "0xkept",
        type: "FEES",
        blockHeight: 20,
        subOperations: [keptRow, tokenOp("0xevicted", 20)],
      });

      const shape = await assembleAccountShape(
        target({
          info: {
            ...target().info,
            initialAccount: storedAccount({
              operations: [storedParent],
              subAccounts: [storedSub([keptRow])],
            }),
          },
          bridgeApi: { getTokenFromAsset: async () => token },
        }),
        snapshot({ balances: [{ value: 3n, asset: usdc }] }),
      );

      expect(shape.operations?.[0].subOperations).toEqual([keptRow]);
    });

    it("carries nothing stored over a round the bound stopped, keeping each token account's own state", async () => {
      const refreshOperations = jest.fn(async () => []);
      const shape = await assembleAccountShape(
        target({
          info: {
            ...target().info,
            initialAccount: storedAccount({
              operations: [liveOp({ hash: "0xold", blockHeight: 10 })],
              pendingOperations: [liveOp({ hash: "0xpending", blockHeight: null })],
              subAccounts: [storedSub([tokenOp("0xoldtoken", 10)])],
            }),
          },
          bridgeApi: { getTokenFromAsset: async () => token, refreshOperations },
        }),
        snapshot({
          balances: [{ value: 3n, asset: usdc }],
          newOperations: [tokenOp("0xnewtoken", 45)],
          bounded: true,
        }),
      );

      expect(shape.operations?.map(op => op.hash)).toEqual(["0xnewtoken"]);
      expect(shape.subAccounts?.[0]).toMatchObject({
        operations: [expect.objectContaining({ hash: "0xnewtoken" })],
        pendingOperations: [{ hash: "pending-sub" }],
        swapHistory: [{ swapId: "swap" }],
      });
      // Its confirmation could sit below the cut: the pending operation waits for a whole round.
      expect(refreshOperations).not.toHaveBeenCalled();
    });
  });

  describe("tokens listed without a balance", () => {
    const usdt = { type: "erc20", assetReference: "0xUSDT", assetOwner: ADDRESS };
    const tether = { ...token, id: "ethereum/erc20/usdt", contractAddress: "0xUSDT" };
    const transfer = liveOp({
      hash: "0xusdt",
      extra: { assetReference: "0xUSDT", assetOwner: ADDRESS, assetAmount: "4" },
    });
    const bridgeApi = {
      getTokenFromAsset: async (asset: { assetReference?: string }) =>
        asset.assetReference?.toLowerCase() === "0xusdt" ? tether : token,
      getAssetFromToken: (found: TokenCurrency) => (found.id === tether.id ? usdt : usdc),
    } as unknown as Partial<BridgeApi>;

    it("reads their balance again and builds their token account", async () => {
      const readTokenBalances = jest.fn(async () => [
        { value: 7n, asset: usdc },
        { value: 4n, asset: usdt },
      ]);

      const shape = await assembleAccountShape(
        target({ bridgeApi, readTokenBalances }),
        snapshot({ balances: [{ value: 7n, asset: usdc }], newOperations: [transfer] }),
      );

      expect(readTokenBalances).toHaveBeenCalledWith([usdt]);
      expect(shape.subAccounts?.map(sub => [sub.token.id, sub.balance.toString()])).toEqual([
        [token.id, "7"],
        [tether.id, "4"],
      ]);
    });

    it("reads nothing again on a path that cannot miss them", async () => {
      const shape = await assembleAccountShape(
        target({ bridgeApi }),
        snapshot({ balances: [{ value: 7n, asset: usdc }], newOperations: [transfer] }),
      );

      expect(shape.subAccounts?.map(sub => sub.token.id)).toEqual([token.id]);
    });
  });

  describe("staking", () => {
    const stakes: Balance[] = [
      { value: 1000n, asset: { type: "native" } },
      {
        value: 0n,
        asset: { type: "native" },
        stake: {
          uid: "s1",
          address: ADDRESS,
          delegate: "val1",
          state: "active",
          asset: { type: "native" },
          amount: 400n,
          actions: [],
        },
      },
    ];
    const validators = [
      {
        validatorAddress: "val1",
        name: "val1",
        commission: 0,
        tokens: "0",
        votingPower: 0,
        estimatedYearlyRewardsRate: 0,
      },
    ];

    it("enriches the staking resources of a staking family through the chain reads", async () => {
      const enrichStakingResources = jest.fn(
        async (_c: unknown, _a: string, _o: unknown, resources: StakingResources) => ({
          ...resources,
          redelegations: [
            {
              validatorSrcAddress: "a",
              validatorDstAddress: "b",
              amount: new BigNumber(1),
              completionDate: new Date(0),
            },
          ],
        }),
      );

      const shape = await assembleAccountShape(
        target({ bridgeApi: { stakingSupported: true, enrichStakingResources } }),
        snapshot({ balances: stakes, validators, newOperations: [liveOp()] }),
      );

      expect(enrichStakingResources).toHaveBeenCalledWith(
        currency,
        ADDRESS,
        shape.operations,
        expect.objectContaining({ delegatedBalance: new BigNumber(400), validators }),
        chain,
      );
      expect(shape.stakingResources).toMatchObject({
        delegations: [expect.objectContaining({ validatorAddress: "val1" })],
        redelegations: [expect.objectContaining({ validatorSrcAddress: "a" })],
        validators,
      });
      expect(shape.balance).toEqual(new BigNumber(1000));
    });

    it("keeps the base staking resources when the enrichment fails", async () => {
      const enrichStakingResources = jest.fn(async () => {
        throw new Error("rest down");
      });

      const shape = await assembleAccountShape(
        target({ bridgeApi: { stakingSupported: true, enrichStakingResources } }),
        snapshot({ balances: stakes }),
      );

      expect(shape.stakingResources).toMatchObject({ redelegations: [] });
      expect(log).toHaveBeenCalledWith(
        "generic-coin-framework",
        "enrichStakingResources failed, falling back to base staking resources",
        { error: "rest down" },
      );

      jest.mocked(enrichStakingResources).mockRejectedValueOnce("down");
      await assembleAccountShape(
        target({ bridgeApi: { stakingSupported: true, enrichStakingResources } }),
        snapshot({ balances: stakes }),
      );
      expect(log).toHaveBeenLastCalledWith(
        "generic-coin-framework",
        "enrichStakingResources failed, falling back to base staking resources",
        { error: "down" },
      );
    });

    it("reports staking for a family that does not declare it once the account holds stakes", async () => {
      const shape = await assembleAccountShape(target(), snapshot({ balances: stakes }));
      expect(shape.stakingResources).toMatchObject({ delegatedBalance: new BigNumber(400) });

      const none = await assembleAccountShape(target(), snapshot());
      expect(none).not.toHaveProperty("stakingResources");

      const declaredOff = await assembleAccountShape(
        target({ bridgeApi: { stakingSupported: false } }),
        snapshot({ balances: stakes }),
      );
      expect(declaredOff).not.toHaveProperty("stakingResources");
    });

    it("reports the positions of a family using staking positions, summing a partitioned balance", async () => {
      const shape = await assembleAccountShape(
        target({ bridgeApi: { usesStakingPositions: true, partitionsNativeBalance: true } }),
        snapshot({
          balances: [
            { value: 600n, asset: { type: "native" } },
            { value: 400n, locked: 400n, asset: { type: "native" }, stake: stakes[1].stake },
          ],
        }),
      );

      expect(shape.stakingPositions).toEqual([
        expect.objectContaining({ uid: "s1", amount: new BigNumber(400) }),
      ]);
      expect(shape).not.toHaveProperty("stakingResources");
      expect(shape.balance).toEqual(new BigNumber(1000));
      expect(shape.spendableBalance).toEqual(new BigNumber(600));
    });
  });

  describe("xpub", () => {
    it("stores the device key, the stored one, or the address", async () => {
      const withKey = await assembleAccountShape(
        target({ info: { ...target().info, rest: { publicKey: "devicekey" } } }),
        snapshot(),
      );
      expect(withKey.xpub).toBe("devicekey");

      const blankKey = await assembleAccountShape(
        target({ info: { ...target().info, rest: { publicKey: "" } } }),
        snapshot(),
      );
      expect(blankKey.xpub).toBe(ADDRESS);
    });

    it("stores none when every account of an address lookup family shares the seed key", async () => {
      const hedera = getCryptoCurrencyById("hedera");
      const addressLookup = { getAddresses: jest.fn(), keyControlsAccount: jest.fn() };

      const shared = await assembleAccountShape(
        target({
          info: { ...target().info, currency: hedera, derivationMode: "hederaBip44" },
          bridgeApi: { addressLookup },
        }),
        snapshot(),
      );
      expect(shared.xpub).toBeUndefined();

      const perAccount = await assembleAccountShape(
        target({ bridgeApi: { addressLookup } }),
        snapshot(),
      );
      expect(perAccount.xpub).toBe(ADDRESS);
    });
  });
});
