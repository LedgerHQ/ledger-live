import {
  AnchorMode,
  deserializeTransaction,
  makeRandomPrivKey,
  privateKeyToPublic,
  publicKeyToHex,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { applySignatureToTransaction, createStxTransferTransaction } from "./transactions";

// No mocks in this file: transactions.unit.test.ts mocks createMessageSignature, which would hide
// the exact bug this guards against -- @stacks/transactions@7's StacksTransactionWire.serialize()
// returns a hex string (verified at runtime), not the pre-v7 raw-bytes Buffer/Uint8Array. Encoding
// that hex string with the default (utf8) Buffer.from() instead of decoding it as hex produces a
// buffer double the expected length, made of the hex text's own ASCII bytes -- structurally
// plausible enough to pass a shallow "is a Buffer" check, but undecodable/unbroadcastable.
describe("applySignatureToTransaction (real SDK, no mocks)", () => {
  it("produces a buffer that round-trips through deserializeTransaction", async () => {
    const senderKey = makeRandomPrivKey();
    const publicKey = publicKeyToHex(privateKeyToPublic(senderKey));
    const unsigned = await createStxTransferTransaction(
      new BigNumber(1000),
      "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J",
      AnchorMode.Any,
      "mainnet",
      publicKey,
      { fee: new BigNumber(200), nonce: new BigNumber(0) },
    );
    // Byte length of the real, correctly-decoded unsigned payload (serialize() returns a hex
    // string, so /2 converts its character count to bytes).
    const unsignedByteLength = unsigned.serialize().length / 2;

    // A 65-byte recoverable ECDSA signature, real shape but not cryptographically valid -- this
    // test only asserts on encoding correctness, not signature validity.
    const fakeSignature = "00".repeat(65);
    const result = applySignatureToTransaction(unsigned, fakeSignature);

    expect(result).toBeInstanceOf(Buffer);
    // The spending condition's signature field is a fixed-size slot already present in the
    // unsigned payload, so signing fills it in rather than growing the transaction -- a
    // double-hex-encoding regression would instead produce a buffer roughly 2x this size (one
    // byte per hex *character* of the signed hex string, not per byte).
    expect(result.length).toBeLessThan(unsignedByteLength * 1.5);
    expect(() => deserializeTransaction(result.toString("hex"))).not.toThrow();
  });
});
