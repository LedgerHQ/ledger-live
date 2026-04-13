import { additionalErc20SignaturesBlob } from "../../../src/services/ledger/data";

describe("Celo ledger data", () => {
  it("exports additionalErc20SignaturesBlob", () => {
    expect(typeof additionalErc20SignaturesBlob).toBe("string");
    expect(additionalErc20SignaturesBlob.length).toBeGreaterThan(0);
    expect(additionalErc20SignaturesBlob).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
