import { cryptoFor } from "./derivation";

describe("cryptoFor", () => {
  it("builds the key derivation of a currency once", () => {
    const bitcoin = cryptoFor("bitcoin");
    expect(cryptoFor("bitcoin")).toBe(bitcoin);
    expect(cryptoFor("litecoin")).not.toBe(bitcoin);
  });
});
