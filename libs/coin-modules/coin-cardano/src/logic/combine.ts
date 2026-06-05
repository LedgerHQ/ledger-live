import * as cbors from "@stricahq/cbors";

// A Cardano signed transaction is the CBOR array
// [transaction_body, transaction_witness_set, is_valid, auxiliary_data].
// Vkey witnesses live in the witness-set map at key 0, each as a
// [public_key(32B), signature(64B)] pair.
const VKEY_WITNESS_SET_KEY = 0;
const ED25519_SIGNATURE_LENGTH = 64;
const ED25519_PUBLIC_KEY_LENGTH = 32;

type VKeyWitness = [Buffer, Buffer];
type Transaction = [unknown, Map<number, unknown>, unknown, unknown];

// Buffer.from(.., "hex") silently truncates at the first non-hex pair, so verify
// the round-trip to reject malformed hex with an actionable message.
function decodeHex(value: string, label: string): Buffer {
  const buffer = Buffer.from(value, "hex");
  if (buffer.toString("hex") !== value.toLowerCase()) {
    throw new Error(`cardano: ${label} is not valid hex`);
  }
  return buffer;
}

function decodeFixedHex(value: string, label: string, expectedLength: number): Buffer {
  const buffer = decodeHex(value, label);
  if (buffer.length !== expectedLength) {
    throw new Error(
      `cardano: invalid ${label} length, expected ${expectedLength} bytes, got ${buffer.length}`,
    );
  }
  return buffer;
}

function decodeTransaction(tx: string): Transaction {
  const bytes = decodeHex(tx, "transaction");
  let value: unknown;
  try {
    ({ value } = cbors.Decoder.decode(bytes));
  } catch {
    throw new Error("cardano: invalid transaction, not valid CBOR");
  }
  if (!Array.isArray(value) || value.length !== 4) {
    throw new TypeError("cardano: invalid transaction, expected a 4-element CBOR array");
  }
  if (!(value[1] instanceof Map)) {
    throw new TypeError("cardano: invalid transaction, witness set is not a CBOR map");
  }
  return value as Transaction;
}

/**
 * Combine an unsigned crafted Cardano transaction with a device signature to
 * produce the signed transaction ready for {@link broadcast}.
 *
 * Attaches a single vkey witness, matching the CoinModule signing contract (one path → one
 * signature → one combine). This fully covers single-witness transactions (native and token
 * sends). Staking and reward-withdrawal transactions additionally require the stake credential's
 * witness, which the single-signature CoinModule path cannot produce yet — see LIVE-18625
 * follow-up; the legacy account bridge handles those via the xpub-based multi-witness device flow.
 *
 * @param tx unsigned transaction as returned by craftTransaction — hex CBOR of
 *   [body, witness_set, is_valid, auxiliary_data]. As crafted the witness set is empty; any
 *   witnesses already present are preserved (combining onto a partially-signed tx).
 * @param signature hex ed25519 signature (64 bytes) from the device.
 * @param pubkey hex ed25519 public key (32 bytes); required to build the vkey witness.
 * @returns the signed transaction as hex CBOR.
 */
export function combine(tx: string, signature: string, pubkey?: string): string {
  if (!pubkey) {
    throw new Error("cardano: combine requires the signing public key");
  }

  const signatureBuffer = decodeFixedHex(signature, "signature", ED25519_SIGNATURE_LENGTH);
  const publicKeyBuffer = decodeFixedHex(pubkey, "public key", ED25519_PUBLIC_KEY_LENGTH);

  const transaction = decodeTransaction(tx);
  const witnessSet = transaction[1];

  // Add this witness to any already in the set; a freshly crafted transaction
  // starts empty, but combining onto a partially-signed one must not drop them.
  const existing = witnessSet.get(VKEY_WITNESS_SET_KEY);
  if (existing !== undefined && !Array.isArray(existing)) {
    throw new TypeError("cardano: invalid transaction, vkey witnesses is not a CBOR array");
  }
  const vkeyWitnesses = (existing as VKeyWitness[] | undefined) ?? [];
  vkeyWitnesses.push([publicKeyBuffer, signatureBuffer]);
  witnessSet.set(VKEY_WITNESS_SET_KEY, vkeyWitnesses);

  return cbors.Encoder.encode(transaction).toString("hex");
}
