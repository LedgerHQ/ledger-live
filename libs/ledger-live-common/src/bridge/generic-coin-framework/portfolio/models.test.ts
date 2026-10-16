import { toJsonOperation, type AccountOperation } from "@ledgerhq/account-module-framework";
import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import * as tronErrors from "@ledgerhq/coin-tron/types/errors";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  AccountBalances,
  BalanceEntry,
  OperationView,
  StakeInfo,
} from "@ledgerhq/portfolio-module-framework";
import { createLocalPortfolio, createMemoryPortfolioStore } from "@ledgerhq/portfolio-module-local";
import {
  ADDRESS,
  fakeAccountModule,
  fakeCoinModule,
  ripple,
  standInNetwork,
} from "../tests/portfolioFixtures";
import {
  balancesFromEntries,
  coreOperationFromView,
  fromUtxoView,
  stakeFromInfo,
  validationFromView,
  withCalIds,
} from "./models";

const native = { type: "native" } as const;
const usdt = {
  type: "trc20",
  assetReference: "TR7",
  assetOwner: "TIssuer",
  name: "Tether",
  unit: { name: "Tether", code: "USDT", magnitude: 6 },
};

/** The entries the local side answers for `balances`, as an account module reports them. */
async function localEntries(balances: Balance[]): Promise<BalanceEntry[]> {
  const accountModule = fakeAccountModule();
  accountModule.getBalances.mockResolvedValue(balances);
  const local = createLocalPortfolio({
    networks: { xrp: standInNetwork(ripple, fakeCoinModule(), accountModule, "static") },
    store: createMemoryPortfolioStore(),
  });
  await local.createPortfolio("p");
  await local.addRegistrations("p", [
    { type: "static", accountId: "a", network: "xrp", addresses: [ADDRESS] },
  ]);
  const page = await local.getPortfolioBalance("p");
  return (page.items as Extract<AccountBalances, { type: "success" }>[]).flatMap(
    ({ items }) => items ?? [],
  );
}

describe("balancesFromEntries of the local implementations", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const stateUpdatedAt = new Date("2026-02-01T00:00:00.000Z");
  const reported: Balance[] = [
    { value: 1_000n, locked: 300n, asset: native },
    {
      value: 400n,
      asset: native,
      stake: {
        uid: "s1",
        address: "stake-1",
        delegate: "validator",
        state: "activating",
        actions: ["undelegate"],
        asset: native,
        amount: 400n,
        amountDeposited: 390n,
        amountRewarded: 10n,
        createdAt,
        stateUpdatedAt,
        details: { activeAmount: 1, pending: 5n },
      },
    },
    {
      value: 50n,
      asset: native,
      stake: {
        uid: "s2",
        address: "stake-2",
        state: "withdrawable",
        actions: ["withdraw"],
        asset: native,
        amount: 50n,
      },
    },
    { value: 5n, locked: 5n, asset: usdt },
    { value: 0n, locked: 0n, asset: { type: "trc10", assetReference: "1002000" } },
  ];

  it("rebuilds the network's balance list exactly, stakes once, through the local side", async () => {
    const entries = await localEntries(reported);
    // Shuffled: the entries' index tells the order.
    const { balances, calIds } = balancesFromEntries([...entries].reverse());

    expect(balances).toEqual([
      { value: 1_000n, locked: 300n, asset: native },
      {
        value: 400n,
        asset: native,
        stake: {
          uid: "s1",
          address: "stake-1",
          delegate: "validator",
          state: "activating",
          actions: ["undelegate"],
          asset: native,
          amount: 400n,
          amountDeposited: 390n,
          amountRewarded: 10n,
          createdAt,
          stateUpdatedAt,
          // The JSON form of the stake's details.
          details: { activeAmount: 1, pending: "5" },
        },
      },
      {
        value: 50n,
        asset: native,
        // Only what the network reported: no delegate, deposit, reward nor creation date.
        stake: {
          uid: "s2",
          address: "stake-2",
          state: "withdrawable",
          actions: ["withdraw"],
          asset: native,
          amount: 50n,
        },
      },
      // The asset as its chain names it: no name nor unit (no client reads them).
      {
        value: 5n,
        locked: 5n,
        asset: { type: "trc20", assetReference: "TR7", assetOwner: "TIssuer" },
      },
      { value: 0n, asset: { type: "trc10", assetReference: "1002000" } },
    ]);
    expect(calIds.size).toBe(0);
  });

  it("is no balance for no entry", () => {
    expect(balancesFromEntries([])).toEqual({ balances: [], calIds: new Map() });
  });
});

describe("balancesFromEntries of the portfolio-service", () => {
  const entry = (amount: string, fields: Partial<BalanceEntry> = {}): BalanceEntry => ({
    network: "xrp",
    account_id: "service-account",
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
  const stake = (delegate: string): StakeInfo => ({
    address: "stake",
    delegate,
    state: "active",
    amount: "400",
    amount_deposited: "400",
    amount_rewarded: "0",
    created_at: "",
  });

  it("puts the stake-free native balance first, one balance per stake beside it", () => {
    const { balances } = balancesFromEntries([
      entry("400", { stake: stake("v1") }),
      entry("700"),
      entry("100", { stake: stake("v1"), locked: true }),
      entry("300", { locked: true }),
      entry("50", { stake: stake("v2") }),
    ]);

    expect(balances.map(({ value, locked, stake }) => [value, locked, stake?.delegate])).toEqual([
      [1_000n, 300n, undefined],
      [500n, 100n, "v1"],
      [50n, undefined, "v2"],
    ]);
  });

  it("keeps a main balance carrying its own stake first", () => {
    const { balances } = balancesFromEntries([entry("1000", { stake: stake("node") })]);
    expect(balances).toEqual([
      expect.objectContaining({
        value: 1_000n,
        stake: expect.objectContaining({ delegate: "node" }),
      }),
    ]);
  });

  it("gives one balance per token asset, keeping the catalog id the service told", () => {
    const { balances, calIds } = balancesFromEntries([
      entry("700"),
      entry("9", { asset: "USD.rIssuer", cal_id: "ripple/token/usd" }),
      entry("1", { asset: "USD.rIssuer", locked: true }),
      entry("3", { asset: "EUR.rIssuer" }),
    ]);

    expect(balances).toEqual([
      { value: 700n, asset: native },
      { value: 10n, locked: 1n, asset: { type: "token", assetReference: "USD.rIssuer" } },
      { value: 3n, asset: { type: "token", assetReference: "EUR.rIssuer" } },
    ]);
    expect([...calIds]).toEqual([["USD.rIssuer", "ripple/token/usd"]]);
  });

  it("reads entries without their chain asset as the service's", () => {
    const { balances } = balancesFromEntries([entry("700", { balance_index: 0 })]);
    expect(balances).toEqual([{ value: 700n, asset: native }]);
  });
});

describe("stakeFromInfo", () => {
  const info: StakeInfo = {
    address: "stake",
    delegate: "",
    state: "inactive",
    amount: "100",
    amount_deposited: "100",
    amount_rewarded: "0",
    created_at: "",
  };

  it("revives the stake as the network reported it", () => {
    expect(
      stakeFromInfo({
        ...info,
        delegate: "validator",
        amount_deposited: "90",
        amount_rewarded: "10",
        created_at: "2026-01-01T00:00:00.000Z",
        position: {
          uid: "uid",
          state: "withdrawable",
          actions: ["withdraw"],
          asset_info: { type: "native" },
          reported: ["amount_rewarded"],
        },
      }),
    ).toEqual({
      uid: "uid",
      address: "stake",
      state: "withdrawable",
      actions: ["withdraw"],
      asset: native,
      amount: 100n,
      amountRewarded: 10n,
    });
  });

  it("reads the service form, an empty delegate or creation date as absent", () => {
    const asset = { type: "token", assetReference: "USD" };
    expect(stakeFromInfo(info, asset)).toEqual({
      uid: "stake::inactive",
      address: "stake",
      state: "inactive",
      actions: [],
      asset,
      amount: 100n,
      amountDeposited: 100n,
      amountRewarded: 0n,
    });
    const stateUpdatedAt = "2026-02-01T00:00:00.000Z";
    const createdAt = "2026-01-01T00:00:00.000Z";
    for (const [state, expected] of [
      ["active", "active"],
      ["unstaking", "deactivating"],
      ["withdrawn", "withdrawable"],
    ] as const) {
      expect(
        stakeFromInfo({
          ...info,
          state,
          delegate: "v",
          created_at: createdAt,
          state_updated_at: stateUpdatedAt,
        }),
      ).toMatchObject({
        uid: `stake:v:${state}`,
        state: expected,
        delegate: "v",
        asset: native,
        createdAt: new Date(createdAt),
        stateUpdatedAt: new Date(stateUpdatedAt),
      });
    }
  });
});

const view = (fields: Partial<AccountOperation> = {}): OperationView =>
  toJsonOperation({
    id: "coin-op",
    hash: "hash",
    type: "OUT",
    value: 110n,
    fee: 10n,
    asset: native,
    senders: ["me"],
    recipients: ["them"],
    block: { height: 7, hash: "block-7", time: new Date("2026-10-01T10:00:00.000Z") },
    date: new Date("2026-10-01T10:00:00.000Z"),
    failed: false,
    ...fields,
  }) as OperationView;

describe("coreOperationFromView", () => {
  it("is the coin module's operation of a native send, the fee the account module counted taken out", () => {
    expect(coreOperationFromView(view({ feesPayer: "me", details: { sequence: "3" } }))).toEqual({
      id: "coin-op",
      type: "OUT",
      senders: ["me"],
      recipients: ["them"],
      value: 100n,
      asset: native,
      details: { sequence: "3" },
      tx: {
        hash: "hash",
        block: { height: 7, hash: "block-7", time: new Date("2026-10-01T10:00:00.000Z") },
        fees: 10n,
        feesPayer: "me",
        date: new Date("2026-10-01T10:00:00.000Z"),
        failed: false,
      },
    });
  });

  it("keeps the value of a failed send, a token send, and of the types counting no fee", () => {
    expect(coreOperationFromView(view({ failed: true, value: 10n })).value).toBe(10n);
    expect(coreOperationFromView(view({ asset: usdt, value: 5n })).value).toBe(5n);
    expect(coreOperationFromView(view({ type: "IN", value: 500n })).value).toBe(500n);
    expect(coreOperationFromView(view({ type: "FREEZE", value: 500n })).value).toBe(500n);
    expect(coreOperationFromView(view({ type: "FEES", value: 10n })).value).toBe(0n);
  });

  it("puts an operation in no block at height 0, on its date", () => {
    const { tx, details } = coreOperationFromView(view({ block: null }));
    expect(tx.block).toEqual({ height: 0, hash: "", time: new Date("2026-10-01T10:00:00.000Z") });
    expect(tx).not.toHaveProperty("feesPayer");
    expect(details).toBeUndefined();
  });

  it("keeps the module's own details, its memo whatever it is, the stake amount a bigint again", () => {
    const memo = { type: "map", memos: [["destinationTag", 1]] };
    const { details } = coreOperationFromView(
      view({
        memo: { kind: "text", value: "structured" },
        details: { memo, familyExtra: { big: 5n }, stake: { address: "s", amount: 777n } },
      }),
    );
    expect(details).toEqual({
      memo,
      familyExtra: { big: "5" },
      stake: { address: "s", amount: 777n },
    });
  });

  it("leaves a stake amount that is no decimal, and a stake that is no object", () => {
    for (const stake of [{ amount: "1.5" }, { amount: 3 }, ["s"], null, "s"]) {
      expect(coreOperationFromView(view({ details: { stake } })).details).toEqual({ stake });
    }
  });
});

describe("withCalIds", () => {
  const usd = { id: "ripple/token/usd" };
  const findTokenById = jest.fn(async (id: string) => ({ id }) as never);

  beforeEach(() => {
    findTokenById.mockClear();
    setCryptoAssetsStore({
      findTokenById,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    } as never);
  });

  afterEach(() => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    } as never);
  });

  it("finds an asset whose catalog id the service told by that id", async () => {
    const lookup = jest.fn();
    const getTokenFromAsset = withCalIds(lookup, new Map([["USD.rIssuer", usd.id]]));

    await expect(
      getTokenFromAsset({ type: "token", assetReference: "USD.rIssuer" }),
    ).resolves.toEqual(usd);
    expect(findTokenById).toHaveBeenCalledWith(usd.id);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("looks any other up as the legacy path does, telling apart two tokens sharing a code", async () => {
    const lookup = jest.fn(
      async (asset: AssetInfo) => ({ id: (asset as { assetOwner?: string }).assetOwner }) as never,
    );
    const getTokenFromAsset = withCalIds(lookup, new Map());

    await expect(
      getTokenFromAsset({ type: "credit_alphanum4", assetReference: "USDC", assetOwner: "GA" }),
    ).resolves.toEqual({ id: "GA" });
    await expect(
      getTokenFromAsset({ type: "credit_alphanum4", assetReference: "USDC", assetOwner: "GB" }),
    ).resolves.toEqual({ id: "GB" });
    expect(findTokenById).not.toHaveBeenCalled();
  });

  it("finds nothing without a lookup", async () => {
    await expect(withCalIds(undefined, new Map())({ type: "token" })).resolves.toBeUndefined();
  });
});

describe("validationFromView", () => {
  it("revives the errors as the family's coin module throws them, the amounts as bigints", () => {
    const validation = validationFromView(
      {
        errors: { gasLimit: { name: "NotEnoughGas", message: "NotEnoughGas", fees: "1" } },
        warnings: { amount: { name: "Unknown", message: "careful" } },
        estimatedFees: "10",
        totalFees: "12",
        amount: "100",
        totalSpent: "112",
      },
      "tron",
    );

    expect(validation).toMatchObject({
      estimatedFees: 10n,
      totalFees: 12n,
      amount: 100n,
      totalSpent: 112n,
    });
    expect(validation.errors.gasLimit).toBeInstanceOf(tronErrors.NotEnoughGas);
    expect(validation.errors.gasLimit).toMatchObject({ fees: "1" });
    expect(validation.warnings.amount).toMatchObject({ name: "Unknown", message: "careful" });
  });

  it("tells no total fees when the view has none", () => {
    const validation = validationFromView({
      errors: {},
      warnings: {},
      estimatedFees: "0",
      amount: "0",
      totalSpent: "0",
    });
    expect(validation).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: 0n,
      amount: 0n,
      totalSpent: 0n,
    });
  });
});

describe("fromUtxoView", () => {
  it("is the output a binding reads, its value a bigint", () => {
    expect(
      fromUtxoView({
        txid: "t",
        vout: 1,
        value: "1000",
        address: "bc1q",
        derivationPath: "84'/0'/0'/0/1",
        height: null,
        replaceable: true,
        change: false,
      }),
    ).toEqual({
      txid: "t",
      vout: 1,
      value: 1000n,
      address: "bc1q",
      height: null,
      replaceable: true,
      change: false,
    });
  });
});
