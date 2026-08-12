import { KeyAlgorithm, PrivateKey, byteHash } from "casper-js-sdk";
import type { CasperGetAddrResponse, CasperSigner } from "@ledgerhq/coin-casper/types";

const APDU_SUCCESS = 0x9000;

const CALLTABLE_VERSION = 1;
const HASH_FIELD = 0;
const PAYLOAD_FIELD = 1;
const HEADER_PREFIX_LENGTH = 5; // version byte + u32 field count
const FIELD_ENTRY_LENGTH = 6; // u16 index + u32 offset

// `Transaction.toBytes()` is a calltable serialization:
// `[u8 version][u32 field count][(u16 index, u32 offset) × N][u32 blob length][blob]`.
// casper-js-sdk doesn't export `CalltableSerialization`, so this reads the header itself.
function parseCalltable(bytes: Buffer): Map<number, Buffer> {
  if (bytes.length < HEADER_PREFIX_LENGTH) {
    throw new Error(`casper tester signer: calltable is ${bytes.length} bytes, too short to parse`);
  }

  const version = bytes.readUInt8(0);
  if (version !== CALLTABLE_VERSION) {
    throw new Error(`casper tester signer: unsupported calltable version ${version}`);
  }

  const fieldCount = bytes.readUInt32LE(1);
  const headerEnd = HEADER_PREFIX_LENGTH + fieldCount * FIELD_ENTRY_LENGTH;
  if (bytes.length < headerEnd + 4) {
    throw new Error(
      `casper tester signer: calltable header claims ${fieldCount} fields but the buffer holds ${bytes.length} bytes`,
    );
  }

  const entries = Array.from({ length: fieldCount }, (_, i) => {
    const at = HEADER_PREFIX_LENGTH + i * FIELD_ENTRY_LENGTH;
    return { index: bytes.readUInt16LE(at), offset: bytes.readUInt32LE(at + 2) };
  });

  const blobLength = bytes.readUInt32LE(headerEnd);
  const blob = bytes.subarray(headerEnd + 4, headerEnd + 4 + blobLength);
  if (blob.length !== blobLength) {
    throw new Error(
      `casper tester signer: calltable blob is ${blob.length} bytes, header says ${blobLength}`,
    );
  }

  // Each field's end is the next header entry's offset, so this assumes header
  // entries are in ascending-offset order.
  const fields = new Map<number, Buffer>();
  entries.forEach(({ index, offset }, i) => {
    const end = i + 1 < entries.length ? entries[i + 1].offset : blobLength;
    fields.set(index, blob.subarray(offset, end));
  });
  return fields;
}

// Checking the hash here gives a legible signer error instead of an
// `invalid signature` rejection at broadcast time.
function extractSignableHash(txBytes: Buffer): Buffer {
  const fields = parseCalltable(txBytes);
  const hash = fields.get(HASH_FIELD);
  const payload = fields.get(PAYLOAD_FIELD);
  if (!hash || !payload) {
    throw new Error("casper tester signer: calltable holds no hash or no payload field");
  }

  const computed = Buffer.from(byteHash(payload));
  if (!computed.equals(hash)) {
    throw new Error(
      `casper tester signer: blake2b256(payload) is ${computed.toString("hex")} but the embedded hash is ${hash.toString("hex")}`,
    );
  }
  return hash;
}

export function buildCasperSigner(pemByPath: Record<string, string>): CasperSigner {
  const keyByPath = new Map(
    Object.entries(pemByPath).map(([path, pem]) => [
      path,
      PrivateKey.fromPem(pem, KeyAlgorithm.SECP256K1),
    ]),
  );

  const keyFor = (path: string): PrivateKey => {
    const key = keyByPath.get(path);
    if (!key) {
      throw new Error(
        `casper tester signer: no key for path ${path}; known paths: ${[...keyByPath.keys()].join(", ")}`,
      );
    }
    return key;
  };

  // `publicKey.bytes()` is the 34-byte tagged form. The device returns the bare
  // 33-byte compressed key and the module's resolver re-adds the tag, so a
  // zero-length Address is what selects that branch.
  const addressResponse = (path: string): CasperGetAddrResponse => ({
    errorMessage: "",
    returnCode: APDU_SUCCESS,
    publicKey: Buffer.from(keyFor(path).publicKey.bytes()).subarray(1),
    Address: Buffer.alloc(0),
  });

  return {
    getAddressAndPubKey: async path => addressResponse(path),
    showAddressAndPubKey: async path => addressResponse(path),
    sign: async (path, message) => {
      const key = keyFor(path);
      const signatureRS = Buffer.from(await key.sign(extractSignableHash(message)));

      return {
        errorMessage: "",
        returnCode: APDU_SUCCESS,
        signatureRS,
        // `signOperation` reads signatureRS only; the other two exist to satisfy
        // the CasperSignature shape.
        signatureRSV: signatureRS,
        signature_compact: signatureRS,
      };
    },
  };
}
