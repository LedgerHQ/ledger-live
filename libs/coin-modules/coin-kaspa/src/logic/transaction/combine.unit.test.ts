import { combine } from "./combine";
import type { UnsignedKaspaTransaction } from "../craftTransaction";

function unsignedTx(overrides: Partial<UnsignedKaspaTransaction> = {}): string {
  const tx: UnsignedKaspaTransaction = {
    version: 0,
    inputs: [{ prevTxId: "a".repeat(64), outpointIndex: 0, value: 1000000 }],
    outputs: [{ value: 900000, scriptPublicKey: "20" + "0".repeat(64) + "ac" }],
    ...overrides,
  };
  return JSON.stringify(tx);
}

describe("combine", () => {
  it("attaches the device signature to the matching input and returns the signed tx JSON", () => {
    const signature = "b".repeat(128);

    const signed = combine(unsignedTx(), JSON.stringify([signature]));
    const parsed = JSON.parse(signed);

    expect(parsed.transaction.inputs).toHaveLength(1);
    expect(parsed.transaction.inputs[0].signatureScript).toBe(`41${signature}01`);
    expect(parsed.transaction.outputs).toHaveLength(1);
  });

  it("preserves the crafted output amounts and script public keys", () => {
    const tx = unsignedTx({
      outputs: [
        { value: 700000, scriptPublicKey: "20" + "1".repeat(64) + "ac" },
        { value: 250000, scriptPublicKey: "20" + "2".repeat(64) + "ac" },
      ],
    });

    const signed = combine(tx, JSON.stringify(["c".repeat(128)]));
    const parsed = JSON.parse(signed);

    expect(parsed.transaction.outputs).toEqual([
      {
        amount: 700000,
        scriptPublicKey: { version: 0, scriptPublicKey: "20" + "1".repeat(64) + "ac" },
      },
      {
        amount: 250000,
        scriptPublicKey: { version: 0, scriptPublicKey: "20" + "2".repeat(64) + "ac" },
      },
    ]);
  });

  it("throws when the signature count does not match the input count", () => {
    const tx = unsignedTx({
      inputs: [
        { prevTxId: "a".repeat(64), outpointIndex: 0, value: 1000000 },
        { prevTxId: "b".repeat(64), outpointIndex: 1, value: 500000 },
      ],
    });

    expect(() => combine(tx, JSON.stringify(["only-one-signature"]))).toThrow(
      "kaspa: combine expected 2 signature(s), got 1",
    );
  });
});
