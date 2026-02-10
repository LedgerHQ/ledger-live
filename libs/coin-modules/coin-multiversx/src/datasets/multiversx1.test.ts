import { multiversx1 } from "./multiversx1";

describe("multiversx1 dataset", () => {
  it("exports a valid AccountRaw structure", () => {
    expect(multiversx1).toBeDefined();
    expect(multiversx1).toHaveProperty("id");
    expect(multiversx1).toHaveProperty("seedIdentifier");
    expect(multiversx1).toHaveProperty("name");
    expect(multiversx1).toHaveProperty("derivationMode");
    expect(multiversx1).toHaveProperty("index");
    expect(multiversx1).toHaveProperty("freshAddress");
    expect(multiversx1).toHaveProperty("freshAddressPath");
    expect(multiversx1).toHaveProperty("pendingOperations");
    expect(multiversx1).toHaveProperty("operations");
    expect(multiversx1).toHaveProperty("currencyId");
    expect(multiversx1).toHaveProperty("balance");
    expect(multiversx1).toHaveProperty("blockHeight");
    expect(multiversx1).toHaveProperty("lastSyncDate");
    expect(multiversx1).toHaveProperty("xpub");
  });

  it("has correct id format", () => {
    expect(multiversx1.id).toMatch(/^js:2:multiversx:/);
  });

  it("has valid MultiversX address format", () => {
    expect(multiversx1.freshAddress).toMatch(/^erd1[a-z0-9]{58}$/);
  });

  it("has correct derivation path", () => {
    expect(multiversx1.freshAddressPath).toBe("44'/508'/0'/0'/0'");
  });

  it("has matching seedIdentifier and freshAddress", () => {
    expect(multiversx1.seedIdentifier).toBe(multiversx1.freshAddress);
  });

  it("has empty operations and pendingOperations arrays", () => {
    expect(multiversx1.operations).toEqual([]);
    expect(multiversx1.pendingOperations).toEqual([]);
  });

  it("has correct currency ID", () => {
    // Note: currencyId is "elrond" for backwards compatibility
    expect(multiversx1.currencyId).toBe("elrond");
  });

  it("has index 0", () => {
    expect(multiversx1.index).toBe(0);
  });

  it("has empty derivationMode", () => {
    expect(multiversx1.derivationMode).toBe("");
  });

  it("has correct name", () => {
    expect(multiversx1.name).toBe("MultiversX 1");
  });
});
