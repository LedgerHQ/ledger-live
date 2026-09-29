import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import type { AccountRef } from "@domain/entity-account";
import { CoinModuleSource, type CoinModuleApi, type CoinModuleSourceHost } from ".";

const ref = {
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

const USDC: AssetInfo = { type: "erc20", assetReference: "0xusdc" };
const SPAM: AssetInfo = { type: "erc20", assetReference: "0xspam" };

const operation = (overrides: Partial<Operation> = {}, txOverrides = {}): Operation => ({
  id: "op",
  type: "OUT",
  senders: ["0xabc"],
  recipients: ["0xdef"],
  value: 1000n,
  asset: { type: "native" },
  tx: {
    hash: "0xhash",
    block: { height: 42, hash: "0xblock", time: new Date("2026-01-31T12:00:00Z") },
    fees: 10n,
    date: new Date("2026-01-31T12:00:00Z"),
    failed: false,
    ...txOverrides,
  },
  ...overrides,
});

const makeSource = (api: Partial<CoinModuleApi>, host: Partial<CoinModuleSourceHost> = {}) =>
  new CoinModuleSource({
    loadApi: async () => ({
      getBalance: async () => [],
      listOperations: async () => ({ items: [] }),
      ...api,
    }),
    resolveToken: async (_currencyId, asset) =>
      "assetReference" in asset && asset.assetReference === "0xusdc"
        ? { id: "ethereum/erc20/usd__coin" }
        : undefined,
    granular: { balance: () => ["evm"], operations: () => ["evm"] },
    ...host,
  });

describe("CoinModuleSource.supports", () => {
  it("follows the injected gate, per datum", () => {
    const source = makeSource({}, { granular: { balance: () => ["evm"] } });
    expect(source.supports(ref, "balance")).toBe(true);
    expect(source.supports(ref, "operations")).toBe(false);
    expect(source.supports({ ...ref, currencyId: "bitcoin" }, "balance")).toBe(false);
    expect(source.supports({ ...ref, currencyId: "unknown-coin" }, "balance")).toBe(false);
  });
});

describe("CoinModuleSource.balance", () => {
  it("returns the native row and the token rows under their parent", async () => {
    const source = makeSource({
      getBalance: async () => [
        { asset: { type: "native" }, value: 100n, locked: 30n },
        { asset: USDC, value: 5n },
      ],
    });
    const rows = await source.balance(ref);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      accountId: ref.accountId,
      balance: "100",
      spendableBalance: "70",
    });
    expect(rows[1]).toMatchObject({
      accountId: `${ref.accountId}+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin`,
      assetId: "ethereum/erc20/usd__coin",
      parentId: ref.accountId,
      balance: "5",
    });
  });

  it("drops unresolved and blacklisted tokens, and floors spendable at zero", async () => {
    const source = makeSource(
      {
        getBalance: async () => [
          { asset: { type: "native" }, value: 10n, locked: 50n },
          { asset: SPAM, value: 1n },
          { asset: USDC, value: 1n },
        ],
      },
      { blacklistedTokenIds: () => ["ethereum/erc20/usd__coin"] },
    );
    const rows = await source.balance(ref);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.spendableBalance).toBe("0");
  });

  it("returns a zero native row when the module reports nothing", async () => {
    expect((await makeSource({}).balance(ref))[0]?.balance).toBe("0");
  });
});

describe("CoinModuleSource.operations", () => {
  it("maps an outgoing native operation, fees included in the value", async () => {
    const source = makeSource({ listOperations: async () => ({ items: [operation()] }) });
    const page = await source.operations(ref, {});
    expect(page.operations[0]).toMatchObject({
      id: `${ref.accountId}-0xhash-OUT`,
      accountId: ref.accountId,
      assetId: "ethereum",
      value: "1010",
      fee: "10",
      blockHeight: 42,
      date: "2026-01-31T12:00:00.000Z",
    });
    expect(page.complete).toBe(true);
    expect(page.nextCursor).toBeUndefined();
  });

  it("books a failed operation at its fees and flags it", async () => {
    const source = makeSource({
      listOperations: async () => ({ items: [operation({}, { failed: true })] }),
    });
    const [row] = (await source.operations(ref, {})).operations;
    expect(row).toMatchObject({ value: "10", hasFailed: true });
  });

  it("puts a token operation on its token account and skips unresolved tokens", async () => {
    const source = makeSource({
      listOperations: async () => ({
        items: [operation({ asset: USDC, type: "IN" }), operation({ asset: SPAM, type: "IN" })],
      }),
    });
    const page = await source.operations(ref, {});
    expect(page.operations).toHaveLength(1);
    expect(page.operations[0]).toMatchObject({
      accountId: `${ref.accountId}+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin`,
      assetId: "ethereum/erc20/usd__coin",
      value: "1000",
    });
  });

  it("forwards the cursor and reports the next one", async () => {
    const listOperations = jest.fn(async () => ({ items: [operation()], next: "c2" }));
    const page = await makeSource({ listOperations }).operations(ref, { cursor: "c1", limit: 10 });
    expect(listOperations).toHaveBeenCalledWith("0xabc", { cursor: "c1", limit: 10 });
    expect(page).toMatchObject({ nextCursor: "c2", complete: false });
  });
});
