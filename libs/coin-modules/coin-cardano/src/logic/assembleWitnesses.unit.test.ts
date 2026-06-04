import type { Witness } from "../signer";
import { assembleWitnesses } from "./assembleWitnesses";

// Fake account key whose derived pubkey bytes encode the [chain, index] it was derived by, so the
// test can assert each witness was matched to the right derivation path.
const fakeAccountKey = {
  derive: (chain: number) => ({
    derive: (index: number) => ({
      toPublicKey: () => ({ toBytes: () => Buffer.from([chain, index]) }),
    }),
  }),
} as never;

describe("assembleWitnesses", () => {
  it("adds a vkey witness per device witness, pubkey derived by the path's chain/index (payment + stake)", () => {
    const built = { hash: "txhash", payload: "signedpayload" };
    const addWitness = jest.fn();
    const unsignedTransaction = { addWitness, buildTransaction: jest.fn(() => built) } as never;

    const witnesses: Witness[] = [
      { path: [1852, 1815, 0, 0, 0], witnessSignatureHex: "aa" }, // payment (chain 0)
      { path: [1852, 1815, 0, 2, 0], witnessSignatureHex: "bb" }, // stake   (chain 2)
    ];

    const result = assembleWitnesses(unsignedTransaction, fakeAccountKey, witnesses);

    expect(addWitness).toHaveBeenCalledTimes(2);
    expect(addWitness).toHaveBeenNthCalledWith(1, {
      signature: Buffer.from("aa", "hex"),
      publicKey: Buffer.from([0, 0]), // chain 0, index 0
    });
    expect(addWitness).toHaveBeenNthCalledWith(2, {
      signature: Buffer.from("bb", "hex"),
      publicKey: Buffer.from([2, 0]), // chain 2, index 0
    });
    expect(result).toBe(built);
  });

  it("adds a single witness for a plain send (payment only)", () => {
    const addWitness = jest.fn();
    const unsignedTransaction = { addWitness, buildTransaction: jest.fn(() => ({})) } as never;

    assembleWitnesses(unsignedTransaction, fakeAccountKey, [
      { path: [1852, 1815, 0, 0, 0], witnessSignatureHex: "aa" },
    ]);

    expect(addWitness).toHaveBeenCalledTimes(1);
  });
});
