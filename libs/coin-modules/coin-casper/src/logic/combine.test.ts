import { Transaction } from "casper-js-sdk";
import { createMockSignedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { combine } from "./combine";

describe("combine", () => {
  it("attaches the signature as an approval that Transaction.fromJSON verifies without throwing", () => {
    const { unsignedTx, taggedSignature, publicKey } = createMockSignedTransaction();

    const combined = combine(unsignedTx, taggedSignature, publicKey);

    expect(() => Transaction.fromJSON(combined)).not.toThrow();
  });

  it("throws when pubkey is missing", () => {
    const { unsignedTx, taggedSignature } = createMockSignedTransaction();

    expect(() => combine(unsignedTx, taggedSignature, undefined)).toThrow(
      "casper: combine requires the signer public key",
    );
  });

  it("produces a transaction that fails verification when the signature is missing its algorithm tag byte", () => {
    const { unsignedTx, untaggedSignature, publicKey } = createMockSignedTransaction();

    const combined = combine(unsignedTx, untaggedSignature, publicKey);

    expect(() => Transaction.fromJSON(combined)).toThrow(Error);
  });

  it("produces a transaction that fails verification when the signature comes from a different keypair", () => {
    const { unsignedTx, wrongKeypairSignature, publicKey } = createMockSignedTransaction();

    const combined = combine(unsignedTx, wrongKeypairSignature, publicKey);

    expect(() => Transaction.fromJSON(combined)).toThrow(Error);
  });

  it("throws on a malformed tx string", () => {
    const { taggedSignature, publicKey } = createMockSignedTransaction();

    expect(() => combine("not-json", taggedSignature, publicKey)).toThrow(Error);
  });
});
