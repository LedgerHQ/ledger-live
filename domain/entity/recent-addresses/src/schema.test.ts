import {
  RecentAddressSchema,
  RecentAddressesArraySchema,
  RecentAddressesStateSchema,
  initialRecentAddressesState,
} from "./schema";

describe("RecentAddressSchema", () => {
  it("keeps a well-formed entry as-is", () => {
    const entry = { address: "0x1", lastUsed: 1000, ensName: "vitalik.eth" };
    expect(RecentAddressSchema.parse(entry)).toEqual(entry);
  });

  it("accepts a well-formed entry without ensName", () => {
    expect(RecentAddressSchema.parse({ address: "0x1", lastUsed: 1000 })).toEqual({
      address: "0x1",
      lastUsed: 1000,
    });
  });

  it("migrates a legacy plain string", () => {
    const parsed = RecentAddressSchema.parse("0x1");
    expect(parsed.address).toBe("0x1");
    expect(parsed.ensName).toBeUndefined();
    expect(parsed.lastUsed).toBeGreaterThan(0);
  });

  it("recovers a corrupted nested entry", () => {
    const parsed = RecentAddressSchema.parse({
      address: { address: "0x1", lastUsed: 500, ensName: "a.eth" },
      index: 3,
    });
    expect(parsed).toEqual({ address: "0x1", lastUsed: 500, ensName: "a.eth" });
  });

  it("rejects an entry with no recoverable address", () => {
    expect(RecentAddressSchema.safeParse({ lastUsed: 1000 }).success).toBe(false);
  });
});

describe("RecentAddressesArraySchema", () => {
  it("drops unparseable and empty-address entries", () => {
    const parsed = RecentAddressesArraySchema.parse([
      { address: "0x1", lastUsed: 1000 },
      { address: "", lastUsed: 1000 },
      null,
      42,
      { invalidKey: "value" },
    ]);
    expect(parsed).toEqual([{ address: "0x1", lastUsed: 1000 }]);
  });
});

describe("RecentAddressesStateSchema", () => {
  it("parses a per-currency state", () => {
    const state = { ethereum: [{ address: "0x1", lastUsed: 1000 }] };
    expect(RecentAddressesStateSchema.parse(state)).toEqual(state);
  });

  it("accepts the initial state", () => {
    expect(RecentAddressesStateSchema.parse(initialRecentAddressesState)).toEqual({});
  });

  it("drops unparseable entries instead of failing the whole record", () => {
    const parsed = RecentAddressesStateSchema.parse({
      ethereum: [{ address: "0x1", lastUsed: 1000 }, null, { invalidKey: "value" }],
      bitcoin: [{ address: "bc1q", lastUsed: 2000 }],
    });
    expect(parsed).toEqual({
      ethereum: [{ address: "0x1", lastUsed: 1000 }],
      bitcoin: [{ address: "bc1q", lastUsed: 2000 }],
    });
  });
});
