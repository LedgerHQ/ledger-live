import {
  COIN_MODULE_CALL_TIERS,
  DEFAULT_METHOD_TIERS,
  isCoinModuleCallTier,
  tierFor,
  toMethodTiers,
} from "./tiers";

describe("tierFor", () => {
  it.each(Object.entries(DEFAULT_METHOD_TIERS))("gives %s its default tier", (method, tier) => {
    expect(tierFor(method)).toBe(tier);
  });

  it("puts the transaction-editing methods in the preparation tier", () => {
    expect(tierFor("craftTransactionData")).toBe("preparation");
    expect(tierFor("estimateFees")).toBe("preparation");
    expect(tierFor("validateIntent")).toBe("preparation");
  });

  it("lets an override win over the default", () => {
    expect(tierFor("craftTransactionData", { craftTransactionData: "off" })).toBe("off");
    expect(tierFor("getBalance", { getBalance: "transaction" })).toBe("transaction");
  });

  it("classifies a method the defaults do not know", () => {
    expect(tierFor("someFutureMethod")).toBe("sync");
    expect(tierFor("someFutureMethod", { someFutureMethod: "preparation" })).toBe("preparation");
  });

  it("ignores inherited object keys", () => {
    expect(tierFor("toString")).toBe("sync");
    expect(tierFor("constructor", {})).toBe("sync");
  });
});

describe("toMethodTiers", () => {
  it("keeps the entries that name a known tier", () => {
    expect(
      toMethodTiers({ estimateFees: "sync", broadcast: "always", lastBlock: null, call: "off" }),
    ).toEqual({ estimateFees: "sync", call: "off" });
  });

  it.each([undefined, null, "sync", 1, ["off"]])("returns no override for %p", value => {
    expect(toMethodTiers(value)).toEqual({});
  });
});

describe("isCoinModuleCallTier", () => {
  it("accepts exactly the known tiers", () => {
    for (const tier of COIN_MODULE_CALL_TIERS) expect(isCoinModuleCallTier(tier)).toBe(true);
    expect(isCoinModuleCallTier("Sync")).toBe(false);
    expect(isCoinModuleCallTier(undefined)).toBe(false);
  });
});
