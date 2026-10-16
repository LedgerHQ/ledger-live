import type { SigningRequest } from "./signingRequest";
import { requestOutputScript } from "./signingRequest";

/**
 * How a transaction built from a signing request differs from that request, or `undefined` when it
 * is that request, signed.
 *
 * - `transaction`: not the request's version, inputs, sequences, locktime or expiry height, or not a
 *   transaction of the request's format at all;
 * - `outputs`: not the request's outputs;
 * - `unsigned`: an input carries no signature.
 */
export type SignedRequestMismatch = "transaction" | "outputs" | "unsigned";

/** Komodo's Sapling header: version 4 with the Overwinter flag, then the Sapling version group id. */
const SAPLING_HEADER = Buffer.from("0400008085202f89", "hex");
/** Komodo's Sapling fields after the expiry height, with no shielded part: value balance and counts. */
const SAPLING_EXTRA_DATA = Buffer.alloc(11);
/** Decred's transaction version (1, full serialization). */
const DECRED_VERSION = Buffer.from("01000000", "hex");

class Reader {
  offset = 0;

  constructor(private readonly bytes: Buffer) {}

  take(length: number): Buffer {
    if (this.offset + length > this.bytes.length) throw new RangeError("truncated transaction");
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  uint32(): number {
    return this.take(4).readUInt32LE(0);
  }

  varInt(): number {
    const first = this.take(1)[0];
    if (first < 0xfd) return first;
    if (first === 0xfd) return this.take(2).readUInt16LE(0);
    if (first === 0xfe) return this.uint32();
    throw new RangeError("unsupported varint");
  }

  script(): Buffer {
    return this.take(this.varInt());
  }

  get done(): boolean {
    return this.offset === this.bytes.length;
  }
}

/** The 4-byte little-endian form of an expiry height given as hex, as the request carries it. */
const expiryHeightOf = (request: SigningRequest): Buffer =>
  Buffer.from(request.expiryHeight ?? "00000000", "hex");

/**
 * Reads `signed` in the format hw-app-btc's `createPaymentTransaction` writes for the request's
 * currency (`serializeTransaction` and its final assembly), and checks every field against the
 * request:
 *
 * - **Komodo** (Sapling): header and version group id, inputs (outpoint, scriptSig, sequence),
 *   outputs, locktime, expiry height, then empty Sapling fields.
 * - **Decred**: version, inputs (outpoint, regular tree, sequence), outputs, locktime, expiry height, then
 *   the witness (value, block height, block index, signature script) of each input.
 *
 * The outputs are compared where the format puts them, never searched for: bytes that merely appear
 * somewhere (e.g. inside an OP_RETURN payload) do not count.
 */
export function signedRequestMismatch(
  signed: Buffer,
  request: SigningRequest,
): SignedRequestMismatch | undefined {
  const decred = request.additionals.includes("decred");
  const reader = new Reader(signed);
  try {
    const header = reader.take(decred ? DECRED_VERSION.length : SAPLING_HEADER.length);
    if (!header.equals(decred ? DECRED_VERSION : SAPLING_HEADER)) return "transaction";

    if (reader.varInt() !== request.inputs.length) return "transaction";
    const scripts: Buffer[] = [];
    for (const input of request.inputs) {
      const txid = Buffer.from(reader.take(32)).reverse().toString("hex");
      const vout = reader.uint32();
      // Decred's tree is part of the outpoint: hw-app-btc always writes the regular tree (0), the
      // one every output the address spends is in. Another tree is another outpoint.
      if (decred && reader.take(1)[0] !== 0) return "transaction";
      if (!decred) scripts.push(reader.script());
      const sequence = reader.uint32();
      if (txid !== input.txid.toLowerCase() || vout !== input.vout || sequence !== input.sequence) {
        return "transaction";
      }
    }

    const outputs = requestOutputScript(request);
    if (!reader.take(outputs.length).equals(outputs)) return "outputs";

    if (reader.uint32() !== (request.lockTime ?? 0)) return "transaction";
    if (!reader.take(4).equals(expiryHeightOf(request))) return "transaction";

    if (decred) {
      if (reader.varInt() !== request.inputs.length) return "transaction";
      for (let i = 0; i < request.inputs.length; i++) {
        reader.take(16); // value, block height, block index
        scripts.push(reader.script());
      }
    } else if (!reader.take(SAPLING_EXTRA_DATA.length).equals(SAPLING_EXTRA_DATA)) {
      return "transaction";
    }
    if (!reader.done) return "transaction";
    return scripts.every(script => script.length > 0) ? undefined : "unsigned";
  } catch {
    // Truncated or malformed: whatever it is, it is not the request's transaction.
    return "transaction";
  }
}
