import { Transaction } from "casper-js-sdk";
import { createMockSignedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { combine } from "./combine";

describe("combine", () => {
  it("attaches the signature as an approval that Transaction.fromJSON verifies without throwing", () => {
    const { unsignedTx, taggedSignature, publicKey } = createMockSignedTransaction();

    const combined = combine(unsignedTx, [taggedSignature], publicKey);

    expect(() => Transaction.fromJSON(combined)).not.toThrow();
  });

  it("throws when pubkey is missing", () => {
    const { unsignedTx, taggedSignature } = createMockSignedTransaction();

    expect(() => combine(unsignedTx, [taggedSignature], undefined)).toThrow(
      "casper: combine requires the signer public key",
    );
  });

  it("produces a transaction that fails verification when the signature comes from a different keypair", () => {
    const { unsignedTx, wrongKeypairSignature, publicKey } = createMockSignedTransaction();

    const combined = combine(unsignedTx, [wrongKeypairSignature], publicKey);

    expect(() => Transaction.fromJSON(combined)).toThrow(Error);
  });

  it("throws on a malformed tx string", () => {
    const { taggedSignature, publicKey } = createMockSignedTransaction();

    expect(() => combine("not-json", [taggedSignature], publicKey)).toThrow(Error);
  });

  it("throws when the signature contains non-hex characters", () => {
    const { unsignedTx, taggedSignature, publicKey } = createMockSignedTransaction();
    const invalidSignature = "zz" + taggedSignature.slice(2);

    expect(() => combine(unsignedTx, [invalidSignature], publicKey)).toThrow(
      "casper: invalid hex signature",
    );
  });

  it("throws when the signature has odd-length hex", () => {
    const { unsignedTx, taggedSignature, publicKey } = createMockSignedTransaction();

    expect(() => combine(unsignedTx, [taggedSignature.slice(0, -1)], publicKey)).toThrow(
      "casper: combine expects a 65-byte (tag + signature) hex signature",
    );
  });

  it("throws when the signature is the wrong length", () => {
    const { unsignedTx, untaggedSignature, publicKey } = createMockSignedTransaction();

    expect(() => combine(unsignedTx, [untaggedSignature], publicKey)).toThrow(
      "casper: combine expects a 65-byte (tag + signature) hex signature",
    );
  });
});
