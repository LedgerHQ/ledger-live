import { buildUnitResolver, byTokenAndDate } from "./proposalSorting";

const NATIVE_UNIT = { name: "Amulet", code: "CC", magnitude: 10 };
const CBTC_UNIT = { name: "CBTC", code: "CBTC", magnitude: 8 };

const makeParentAccount = (subAccounts: unknown[] = []) =>
  ({
    subAccounts,
    currency: { units: [NATIVE_UNIT] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const makeTokenSubAccount = (instrumentId: string, unit = CBTC_UNIT) => ({
  type: "TokenAccount",
  token: { units: [unit] },
  cantonResources: {
    pendingTransferProposals: [{ instrument_id: instrumentId }],
  },
});

describe("buildUnitResolver", () => {
  it("falls back to the parent currency unit when nothing matches", () => {
    const resolve = buildUnitResolver(makeParentAccount());
    expect(resolve("anything")).toBe(NATIVE_UNIT);
  });

  it("resolves a token instrument id to its sub-account's unit", () => {
    const resolve = buildUnitResolver(makeParentAccount([makeTokenSubAccount("cbtc-instrument")]));
    expect(resolve("cbtc-instrument")).toBe(CBTC_UNIT);
    expect(resolve("other")).toBe(NATIVE_UNIT);
  });

  it("ignores non-TokenAccount sub-accounts", () => {
    const resolve = buildUnitResolver(
      makeParentAccount([{ type: "ChildAccount", token: { units: [CBTC_UNIT] } }]),
    );
    expect(resolve("any")).toBe(NATIVE_UNIT);
  });

  it("supports sub-accounts that have no pending proposals", () => {
    const resolve = buildUnitResolver(
      makeParentAccount([
        { type: "TokenAccount", token: { units: [CBTC_UNIT] }, cantonResources: {} },
      ]),
    );
    expect(resolve("cbtc-instrument")).toBe(NATIVE_UNIT);
  });
});

describe("byTokenAndDate", () => {
  it("sorts different instruments alphabetically", () => {
    const list = [
      { instrumentId: "z", expiresAtMicros: 10 },
      { instrumentId: "a", expiresAtMicros: 20 },
      { instrumentId: "m", expiresAtMicros: 5 },
    ];
    list.sort(byTokenAndDate);
    expect(list.map(p => p.instrumentId)).toEqual(["a", "m", "z"]);
  });

  it("sorts soonest-expiring first within the same instrument", () => {
    const list = [
      { instrumentId: "a", expiresAtMicros: 300 },
      { instrumentId: "a", expiresAtMicros: 100 },
      { instrumentId: "a", expiresAtMicros: 200 },
    ];
    list.sort(byTokenAndDate);
    expect(list.map(p => p.expiresAtMicros)).toEqual([100, 200, 300]);
  });

  it("combines both keys: token primary, expiry secondary", () => {
    const list = [
      { instrumentId: "b", expiresAtMicros: 100 },
      { instrumentId: "a", expiresAtMicros: 300 },
      { instrumentId: "b", expiresAtMicros: 50 },
      { instrumentId: "a", expiresAtMicros: 200 },
    ];
    list.sort(byTokenAndDate);
    expect(list).toEqual([
      { instrumentId: "a", expiresAtMicros: 200 },
      { instrumentId: "a", expiresAtMicros: 300 },
      { instrumentId: "b", expiresAtMicros: 50 },
      { instrumentId: "b", expiresAtMicros: 100 },
    ]);
  });
});
