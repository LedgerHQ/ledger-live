import { hashTransaction } from "./hashTransaction";

const ADDRESS = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";

describe("hashTransaction", () => {
  // Regression vector: the SHA-256 of the canonically CBOR-encoded transfer. This hash
  // is the on-chain transaction identity, so a change here means the encoding drifted.
  it("produces the canonical ICP transaction hash", () => {
    const hash = hashTransaction({
      from: ADDRESS,
      to: ADDRESS,
      amount: 100000000n,
      fee: 10000n,
      memo: 0n,
      created_at_time: 1700000000000000000n,
    });
    expect(hash).toBe("e735ed6129e6e6b1b5e4922e3dce0f642afeb49c9eceafbdb037e75b941b44f6");
  });

  it("changes when a field changes", () => {
    const base = {
      from: ADDRESS,
      to: ADDRESS,
      amount: 1n,
      fee: 0n,
      memo: 0n,
      created_at_time: 0n,
    };
    expect(hashTransaction({ ...base, amount: 2n })).not.toBe(hashTransaction(base));
    expect(hashTransaction({ ...base, memo: 1n })).not.toBe(hashTransaction(base));
  });
});
