import { combine } from "./combine";

const UNSIGNED_TX = JSON.stringify({
  nonce: 5,
  value: "1000000000000000000",
  receiver: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
  sender: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
  gasPrice: 1000000000,
  gasLimit: 50000,
  chainID: "1",
  version: 2,
  options: 1,
});

const SIGNATURE = "a".repeat(128); // 64 bytes hex

describe("combine", () => {
  it("attaches signature to parsed transaction", () => {
    const result = combine(UNSIGNED_TX, SIGNATURE);
    const tx = JSON.parse(result);

    expect(tx.signature).toBe(SIGNATURE);
    expect(tx.nonce).toBe(5);
    expect(tx.chainID).toBe("1");
  });

  it("preserves all original fields", () => {
    const result = combine(UNSIGNED_TX, SIGNATURE);
    const tx = JSON.parse(result);

    expect(tx.value).toBe("1000000000000000000");
    expect(tx.gasLimit).toBe(50000);
    expect(tx.version).toBe(2);
    expect(tx.options).toBe(1);
  });

  it("throws on invalid JSON input", () => {
    expect(() => combine("not-json", SIGNATURE)).toThrow();
  });

  it("throws when signature is empty", () => {
    expect(() => combine(UNSIGNED_TX, "")).toThrow("signature is required");
  });

  it("output is valid JSON", () => {
    const result = combine(UNSIGNED_TX, SIGNATURE);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
