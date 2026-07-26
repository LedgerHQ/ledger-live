import { combine } from "./combine";
import type { VechainSDKTransactionBody } from "../../types";

const BODY: VechainSDKTransactionBody = {
  chainTag: 74,
  blockRef: "0x00000000aabbccdd",
  expiration: 18,
  clauses: [{ to: "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86", value: "0x1", data: "0x" }],
  gas: 21000,
  maxFeePerGas: 1000,
  maxPriorityFeePerGas: 100,
  dependsOn: null,
  nonce: "0x1a2b3c4d5e6f7890",
};

describe("combine", () => {
  it("returns a hex-encoded signed transaction", () => {
    const signature = "aa".repeat(65);

    const signed = combine(JSON.stringify(BODY), signature);

    expect(signed).toMatch(/^0x[0-9a-f]+$/);
  });

  it("produces a different (longer) payload than the unsigned body JSON, reflecting the signature", () => {
    const signature = "bb".repeat(65);

    const signed = combine(JSON.stringify(BODY), signature);

    expect(signed.length).toBeGreaterThan(0);
    expect(signed).not.toBe(JSON.stringify(BODY));
  });

  it("throws on a malformed transaction payload", () => {
    expect(() => combine("not-json", "aa".repeat(65))).toThrow();
  });
});
