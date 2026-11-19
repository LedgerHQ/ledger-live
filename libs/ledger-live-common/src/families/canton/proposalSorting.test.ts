import {
  buildInstrumentResolver,
  byTokenAndDate,
  instrumentKey,
  withoutBidiControls,
} from "./proposalSorting";

jest.mock("../../config", () => ({
  getCurrencyConfiguration: () => ({ nativeInstrumentId: "Amulet" }),
}));

const UNKNOWN = "Unknown token";
const DSO = "DSO::1220";
const CBTC_ADMIN = "cbtc-network::1220";
const NATIVE_UNIT = { name: "Amulet", code: "CC", magnitude: 38 };
const CBTC_UNIT = { name: "CBTC", code: "CBTC", magnitude: 38 };
const CBTC = { id: "canton_network/cip56/cbtc", units: [CBTC_UNIT] };

const makeParentAccount = (subAccounts: unknown[] = [], nativeInstrumentAdmin?: string) =>
  ({
    subAccounts,
    currency: { id: "canton_network", units: [NATIVE_UNIT] },
    cantonResources: { pendingTransferProposals: [], nativeInstrumentAdmin },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const makeTokenSubAccount = (instrumentId: string, instrumentAdmin: string) => ({
  type: "TokenAccount",
  token: CBTC,
  cantonResources: {
    pendingTransferProposals: [{ instrument_id: instrumentId, instrument_admin: instrumentAdmin }],
  },
});

const unknown = (instrumentId: string) => ({
  unit: { name: instrumentId, code: UNKNOWN, magnitude: 38 },
  isUnknown: true,
});

describe("buildInstrumentResolver", () => {
  it("shows the native instrument issued by the DSO party in the parent's unit", () => {
    const parent = makeParentAccount([], DSO);

    expect(buildInstrumentResolver(parent, UNKNOWN)("Amulet", DSO)).toEqual({
      unit: NATIVE_UNIT,
      currency: parent.currency,
      isUnknown: false,
    });
  });

  it("shows another admin's instrument under the native id as unknown", () => {
    const resolve = buildInstrumentResolver(makeParentAccount([], DSO), UNKNOWN);

    expect(resolve("Amulet", "impostor::1220")).toEqual(unknown("Amulet"));
  });

  it("treats nothing as native until sync stores the DSO party", () => {
    const resolve = buildInstrumentResolver(makeParentAccount(), UNKNOWN);

    expect(resolve("Amulet", DSO)).toEqual(unknown("Amulet"));
  });

  it("resolves a CAL token by id and admin to its sub-account's unit and token", () => {
    const resolve = buildInstrumentResolver(
      makeParentAccount([makeTokenSubAccount("CBTC", CBTC_ADMIN)], DSO),
      UNKNOWN,
    );

    expect(resolve("CBTC", CBTC_ADMIN)).toEqual({
      unit: CBTC_UNIT,
      currency: CBTC,
      isUnknown: false,
    });
  });

  it("codes an unknown instrument with the given label, not the ticker its issuer picked", () => {
    const resolve = buildInstrumentResolver(makeParentAccount([], DSO), UNKNOWN);

    expect(resolve("CC", "impostor::1220").unit).toEqual({
      name: "CC",
      code: UNKNOWN,
      magnitude: 38,
    });
  });

  it("resolves a CAL token from the CAL lookup when its sub-account is missing", () => {
    const cbtc = { ...CBTC, contractAddress: CBTC_ADMIN };
    const calTokens = new Map([[instrumentKey("CBTC", CBTC_ADMIN), cbtc]]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolve = buildInstrumentResolver(makeParentAccount([], DSO), UNKNOWN, calTokens as any);

    expect(resolve("CBTC", CBTC_ADMIN)).toEqual({
      unit: CBTC_UNIT,
      currency: cbtc,
      isUnknown: false,
    });
    expect(resolve("CBTC", "impostor::1220")).toEqual(unknown("CBTC"));
  });

  it("prefers the token sync matched on a sub-account over the CAL lookup", () => {
    const calCbtc = { id: "older-cal-id", units: [{ ...CBTC_UNIT, code: "OLD" }] };
    const calTokens = new Map([[instrumentKey("CBTC", CBTC_ADMIN), calCbtc]]);
    const resolve = buildInstrumentResolver(
      makeParentAccount([makeTokenSubAccount("CBTC", CBTC_ADMIN)], DSO),
      UNKNOWN,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      calTokens as any,
    );

    expect(resolve("CBTC", CBTC_ADMIN).currency).toBe(CBTC);
  });

  it("shows another admin's instrument under a CAL token's id as unknown", () => {
    const resolve = buildInstrumentResolver(
      makeParentAccount([makeTokenSubAccount("CBTC", CBTC_ADMIN)], DSO),
      UNKNOWN,
    );

    expect(resolve("CBTC", "impostor::1220")).toEqual(unknown("CBTC"));
  });

  it("ignores non-TokenAccount sub-accounts", () => {
    const resolve = buildInstrumentResolver(
      makeParentAccount([{ type: "ChildAccount", token: CBTC }], DSO),
      UNKNOWN,
    );

    expect(resolve("CBTC", CBTC_ADMIN)).toEqual(unknown("CBTC"));
  });

  it("supports sub-accounts that have no pending proposals", () => {
    const resolve = buildInstrumentResolver(
      makeParentAccount([{ type: "TokenAccount", token: CBTC, cantonResources: {} }], DSO),
      UNKNOWN,
    );

    expect(resolve("CBTC", CBTC_ADMIN)).toEqual(unknown("CBTC"));
  });

  it("resolves a CAL token from its own metadata on a sub-account restored without proposals", () => {
    const cbtc = { ...CBTC, tokenIdentifier: "CBTC", contractAddress: CBTC_ADMIN };
    const resolve = buildInstrumentResolver(
      makeParentAccount([{ type: "TokenAccount", token: cbtc }], DSO),
      UNKNOWN,
    );

    expect(resolve("CBTC", CBTC_ADMIN)).toEqual({
      unit: CBTC_UNIT,
      currency: cbtc,
      isUnknown: false,
    });
    expect(resolve("CBTC", "impostor::1220")).toEqual(unknown("CBTC"));
  });
});

describe("withoutBidiControls", () => {
  it("drops the direction controls that could reorder an instrument id on screen", () => {
    expect(withoutBidiControls("\u202ECC\u202C\u2066x\u2069\u200E\u200F\u061C")).toBe("CCx");
  });
});

describe("byTokenAndDate", () => {
  it("sorts different instruments alphabetically", () => {
    const list = [
      { instrumentId: "z", instrumentAdmin: "a", expiresAtMicros: 10 },
      { instrumentId: "a", instrumentAdmin: "a", expiresAtMicros: 20 },
      { instrumentId: "m", instrumentAdmin: "a", expiresAtMicros: 5 },
    ];
    list.sort(byTokenAndDate);
    expect(list.map(p => p.instrumentId)).toEqual(["a", "m", "z"]);
  });

  it("sorts soonest-expiring first within the same instrument", () => {
    const list = [
      { instrumentId: "a", instrumentAdmin: "a", expiresAtMicros: 300 },
      { instrumentId: "a", instrumentAdmin: "a", expiresAtMicros: 100 },
      { instrumentId: "a", instrumentAdmin: "a", expiresAtMicros: 200 },
    ];
    list.sort(byTokenAndDate);
    expect(list.map(p => p.expiresAtMicros)).toEqual([100, 200, 300]);
  });

  it("keeps the same instrument id under different admins in separate groups", () => {
    const list = [
      { instrumentId: "CBTC", instrumentAdmin: "impostor", expiresAtMicros: 100 },
      { instrumentId: "CBTC", instrumentAdmin: "cbtc-network", expiresAtMicros: 300 },
      { instrumentId: "CBTC", instrumentAdmin: "impostor", expiresAtMicros: 50 },
      { instrumentId: "CBTC", instrumentAdmin: "cbtc-network", expiresAtMicros: 200 },
    ];
    list.sort(byTokenAndDate);
    expect(list.map(p => [p.instrumentAdmin, p.expiresAtMicros])).toEqual([
      ["cbtc-network", 200],
      ["cbtc-network", 300],
      ["impostor", 50],
      ["impostor", 100],
    ]);
  });

  it("combines both keys: token primary, expiry secondary", () => {
    const list = [
      { instrumentId: "b", instrumentAdmin: "a", expiresAtMicros: 100 },
      { instrumentId: "a", instrumentAdmin: "a", expiresAtMicros: 300 },
      { instrumentId: "b", instrumentAdmin: "a", expiresAtMicros: 50 },
      { instrumentId: "a", instrumentAdmin: "a", expiresAtMicros: 200 },
    ];
    list.sort(byTokenAndDate);
    expect(list.map(p => [p.instrumentId, p.expiresAtMicros])).toEqual([
      ["a", 200],
      ["a", 300],
      ["b", 50],
      ["b", 100],
    ]);
  });
});
