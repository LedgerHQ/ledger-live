import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { callsOf } from "./fakeCoinModule";
import {
  blockAt,
  coinOperation,
  emptyAccount,
  expectParity,
  freezeTime,
  fromScratch,
  runSyncScenario,
  syncBoth,
  token,
  useTokens,
} from "./harness";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));

const ME = "GMINE";
const OTHER = "someone-else";
const stellar = getCryptoCurrencyById("stellar");
const ethereum = getCryptoCurrencyById("ethereum");
const USD = token({
  id: "stellar/asset/USD:GISSUER",
  parentCurrencyId: "stellar",
  contractAddress: "GISSUER",
  tokenType: "credit_alphanum4",
  tokenIdentifier: "USD",
});
const usd = { type: "credit_alphanum4", assetReference: "USD", assetOwner: "GISSUER" };

/** A payment of the account in block `height`, native or of the token. */
const payment = (height: number, asset?: typeof usd) =>
  coinOperation({
    height,
    type: "IN",
    value: 10n,
    fees: 100n,
    senders: [OTHER],
    recipients: [ME],
    feesPayer: OTHER,
    ...(asset ? { asset, details: { ledgerOpType: "IN", assetAmount: "10" } } : {}),
  });

/** One operation per block, from `from` down to `to`, every third one a token payment. */
const history = (from: number, to: number) =>
  Array.from({ length: from - to + 1 }, (_, i) =>
    payment(from - i, (from - i) % 3 ? undefined : usd),
  );

const balances: Balance[] = [
  { value: 30_000_000n, asset: { type: "native" } },
  { value: 500n, asset: usd },
];

/** Both paths keep at most 4 operations, walking pages of 3. */
const operationHistory = { maxOperations: 4 };

beforeAll(() => {
  freezeTime();
  useTokens([USD]);
});

afterAll(() => jest.useRealTimers());

afterEach(() => jest.restoreAllMocks());

describe("operation history bound", () => {
  it("bounds the walk and the stored history the same way on both paths", async () => {
    const steps = await runSyncScenario({
      currency: stellar,
      family: "stellar",
      account: emptyAccount(stellar, ME),
      chain: { tip: blockAt(60), balances, operations: history(59, 40), pageSize: 3 },
      // More new operations than the bound: the incremental round is bounded too.
      next: {
        tip: blockAt(80),
        balances,
        operations: [
          coinOperation({
            height: 70,
            hash: "stellar-pending",
            type: "OUT",
            value: 10n,
            fees: 100n,
            senders: [ME],
            recipients: [OTHER],
          }),
          ...history(69, 60),
          ...history(59, 40),
        ],
        pageSize: 3,
      },
      pendingHash: "stellar-pending",
      operationHistory,
    });

    const [first, second] = steps;
    // The walk stopped on the bound after two pages of the seven, the lowest block of the last
    // dropped (59 to 55 walked), and the store bound kept four.
    expect(callsOf(first.legacyModule.listOperations)).toHaveLength(2);
    expect(first.legacy.operations.map(op => op.blockHeight)).toEqual([59, 58, 57, 56]);
    // A bounded round carries nothing stored over: only what it listed (70 to 66).
    expect(second.legacy.operations.map(op => op.blockHeight)).toEqual([70, 69, 68, 67]);
    expect(second.legacy.subAccounts?.[0].operations.map(op => op.blockHeight)).toEqual([69, 66]);
    // Its swap history and pending operations stay with the token account.
    expect(second.legacy.subAccounts?.[0].swapHistory).toHaveLength(1);
  });

  it("stores the newest operations of an unbounded walk the same way on both paths", async () => {
    const step = await syncBoth(
      {
        currency: stellar,
        family: "stellar",
        chain: { tip: blockAt(60), balances, operations: history(59, 52) },
        operationHistory,
      },
      fromScratch(emptyAccount(stellar, ME)),
    );

    expectParity(step);
    // One page: the walk reached its end, and the store bound kept the newest four.
    expect(step.legacy.operations.map(op => op.blockHeight)).toEqual([59, 58, 57, 56]);
  });

  it("sends the page size of a family whose page limit is established, on both paths", async () => {
    const step = await syncBoth(
      {
        currency: ethereum,
        family: "evm",
        chain: { tip: blockAt(60), balances: [balances[0]], operations: [payment(59)] },
        operationHistory: { pageSize: 50 },
      },
      fromScratch(emptyAccount(ethereum, "0x1111111111111111111111111111111111111111")),
    );

    expectParity(step);
    expect(callsOf(step.legacyModule.listOperations)).toEqual([
      ["0x1111111111111111111111111111111111111111", expect.objectContaining({ limit: 50 })],
    ]);
  });
});
