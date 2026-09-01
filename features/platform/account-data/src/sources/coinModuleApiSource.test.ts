import { AccountIdSchema } from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { describeAccountDataSourceContract } from "../sourceRequirements";
import { accountIdFor, makeRef } from "../port.mock";
import type { AccountRef, AccountSlice, SliceUpdate } from "../port";
import {
  createCoinModuleApiSource,
  type AssetBalanceRow,
  type CoinModuleApiPort,
} from "./coinModuleApiSource";

const ref = makeRef();
const tokenAccountId = AccountIdSchema.parse(`${ref.accountId}+ethereum%2Ferc20%2Fusd__coin`);
const ETH = CryptoCurrencyIdSchema.parse("ethereum");
const USDC = TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");

const rows: AssetBalanceRow[] = [
  { accountId: ref.accountId, assetId: ETH, value: "1000", locked: "250" },
  { accountId: tokenAccountId, assetId: USDC, value: "42", parentId: ref.accountId },
];

const port = (overrides: Partial<CoinModuleApiPort> = {}): CoinModuleApiPort => ({
  capabilities: () => new Set<AccountSlice>(["balance"]),
  getBalances: async () => rows,
  ...overrides,
});

const collect = async (
  source: ReturnType<typeof createCoinModuleApiSource>,
  slices: AccountSlice[],
  target: AccountRef = ref,
) => {
  const updates: SliceUpdate[] = [];
  for await (const update of source.fetch({ ref: target, slices, reason: "test" })) {
    updates.push(update);
  }
  return updates;
};

describe("createCoinModuleApiSource", () => {
  it("outranks the legacy fan-out by default", () => {
    expect(createCoinModuleApiSource(port()).priority).toBe(10);
  });

  it("supports a ref only when the coin module declares a capability", () => {
    expect(createCoinModuleApiSource(port()).supports(ref)).toBe(true);
    expect(createCoinModuleApiSource(port({ capabilities: () => new Set() })).supports(ref)).toBe(
      false,
    );
  });

  it("refuses a token-account ref, whose balance only its parent's read can produce", () => {
    const source = createCoinModuleApiSource(port());
    const tokenRef = makeRef({ accountId: tokenAccountId, parentId: ref.accountId });
    expect(source.supports(tokenRef)).toBe(false);
    expect([...source.capabilities(tokenRef)]).toEqual([]);
    expect([...source.deliveries(tokenRef)]).toEqual([]);
  });

  it("delivers exactly its capabilities — nothing is produced as a side effect", () => {
    const source = createCoinModuleApiSource(port());
    expect([...source.deliveries(ref)]).toEqual([...source.capabilities(ref)]);
  });

  it("turns one getBalances call into the account row plus its token rows", async () => {
    const [update] = await collect(createCoinModuleApiSource(port()), ["balance"]);
    expect(update.accountId).toBe(ref.accountId);
    expect(update.balances.map(balance => balance.accountId)).toEqual([
      ref.accountId,
      tokenAccountId,
    ]);
  });

  it("subtracts locked from spendable but not from total", async () => {
    const [update] = await collect(createCoinModuleApiSource(port()), ["balance"]);
    expect(update.balances[0]).toMatchObject({
      balance: "1000",
      spendableBalance: "750",
    });
  });

  it("never reports a negative spendable balance", async () => {
    const source = createCoinModuleApiSource(
      port({
        getBalances: async () => [
          { accountId: ref.accountId, assetId: ETH, value: "10", locked: "50" },
        ],
      }),
    );
    const [update] = await collect(source, ["balance"]);
    expect(update.balances[0].spendableBalance).toBe("0");
  });

  it("leaves spendable equal to total when nothing is locked", async () => {
    const source = createCoinModuleApiSource(
      port({
        getBalances: async () => [{ accountId: ref.accountId, assetId: ETH, value: "10" }],
      }),
    );
    const [update] = await collect(source, ["balance"]);
    expect(update.balances[0].spendableBalance).toBe("10");
  });

  it("emits an empty balance set for an address holding nothing", async () => {
    const source = createCoinModuleApiSource(port({ getBalances: async () => [] }));
    const [update] = await collect(source, ["balance"]);
    expect(update.balances).toEqual([]);
  });

  it("does not call the chain when balance was not requested", async () => {
    const getBalances = jest.fn(async () => rows);
    const source = createCoinModuleApiSource(port({ getBalances }));
    expect(await collect(source, ["operations"])).toEqual([]);
    expect(getBalances).not.toHaveBeenCalled();
  });

  it("does not call the chain for a currency it cannot serve", async () => {
    const getBalances = jest.fn(async () => rows);
    const source = createCoinModuleApiSource(port({ capabilities: () => new Set(), getBalances }));
    expect(await collect(source, ["balance"])).toEqual([]);
    expect(getBalances).not.toHaveBeenCalled();
  });

  it("forwards the abort signal to the port", async () => {
    const getBalances = jest.fn(async () => rows);
    const controller = new AbortController();
    const source = createCoinModuleApiSource(port({ getBalances }));
    for await (const _ of source.fetch({
      ref,
      slices: ["balance"],
      reason: "test",
      signal: controller.signal,
    })) {
      // drain
    }
    expect(getBalances).toHaveBeenCalledWith(ref, controller.signal);
  });

  it("rejects a value that is not decimal-encoded", async () => {
    const source = createCoinModuleApiSource(
      port({
        getBalances: async () => [{ accountId: ref.accountId, assetId: ETH, value: "1e18" }],
      }),
    );
    await expect(collect(source, ["balance"])).rejects.toThrow();
  });
});

describeAccountDataSourceContract(
  "createCoinModuleApiSource contract",
  () => createCoinModuleApiSource(port()),
  {
    supported: ref,
    unsupported: makeRef({ accountId: accountIdFor("0xnope"), currencyId: "bitcoin" }),
  },
);
