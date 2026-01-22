import BIPPath from "bip32-path";
import type { AccountTransaction, CredentialDeploymentTransaction } from "./types";
import {
  encodeWord16,
  encodeWord32,
  encodeWord64,
  encodeWord8,
  encodeWord8FromString,
  serializeMap,
  serializeVerifyKey,
  serializeYearMonth,
} from "./utils";

const MAX_CHUNK_SIZE = 255;
const INDEX_LENGTH = 1;
const ONE_OCTET_LENGTH = 1;
const KEY_LENGTH = 32;
const IP_IDENTITY_LENGTH = 4;
const AR_DATA_LENGTH = 2;
const ID_CRED_PUB_SHARE_LENGTH = 96;
const VALID_TO_LENGTH = 3;
const CREATED_AT_LENGTH = 3;
const ATTRIBUTES_LENGTH = 2;
const TAG_LENGTH = 1;
const VALUE_LENGTH = 1;
const CREDENTIAL_ID_LENGTH = 48;
const ACCOUNT_ADDRESS_LENGTH = 32;
const MEMO_LENGTH_SIZE = 2;
const AMOUNT_SIZE = 8;
/**
 * Serializes an account transaction for hardware wallet signing.
 *
 * Expects hw-app format where:
 * - sender is already a raw Buffer (32 bytes)
 * - payload is already serialized
 * - all numeric fields are bigint
 *
 * @private
 * @param accountTransaction The account transaction in hw-app format
 * @returns The serialized account transaction ready for device transmission
 */
export const serializeAccountTransaction = (accountTransaction: AccountTransaction): Buffer => {
  // In hw-app format, sender is raw bytes (transformed from Base58 by coin-concordium)
  const serializedSender = accountTransaction.sender;
  const serializedNonce = encodeWord64(accountTransaction.nonce);
  const serializedEnergyAmount = encodeWord64(accountTransaction.energyAmount);
  const serializedPayloadSize = encodeWord32(accountTransaction.payload.length + 1);
  const serializedExpiry = encodeWord64(accountTransaction.expiry);
  const serializedType = Buffer.from([accountTransaction.transactionType]);

  const serializedHeader = Buffer.concat([
    serializedSender,
    serializedNonce,
    serializedEnergyAmount,
    serializedPayloadSize,
    serializedExpiry,
  ]);

  return Buffer.concat([serializedHeader, serializedType, accountTransaction.payload]);
};

/**
 * Serializes a BIP32 path array into device-compatible format.
 * Format: [1 byte: path length] [4 bytes per element: path components]
 * @private
 */
const serializePath = (path: number[]): Buffer => {
  const buf = Buffer.alloc(1 + path.length * 4);
  buf.writeUInt8(path.length, 0);
  for (const [i, num] of path.entries()) {
    buf.writeUInt32BE(num, 1 + i * 4);
  }
  return buf;
};

/**
 * Splits a BIP32 path string into numeric components.
 *
 * Handles hardened derivation (apostrophe suffix) by adding 0x80000000.
 * Example: "m/44'/919'/0'/0/0" → [0x8000002C, 0x80000397, 0x80000000, 0, 0]
 *
 * @param path - BIP32 path string (e.g., "m/44'/919'/0'/0/0")
 * @returns Array of path components as numbers
 */
export const splitPath = (path: string): number[] => {
  const result: number[] = [];
  const components = path.split("/");
  components.forEach(element => {
    let number = parseInt(element, 10);
    if (isNaN(number)) {
      return;
    }
    if (element.length > 1 && element.endsWith("'")) {
      number += 0x80000000;
    }
    result.push(number);
  });
  return result;
};

/**
 * Converts a BIP32 path string to serialized Buffer format.
 *
 * @param originalPath - BIP32 path string (e.g., "44'/919'/0'/0/0")
 * @returns Serialized path buffer ready for device transmission
 */
export const pathToBuffer = (originalPath: string): Buffer => {
  const path = originalPath;
  const pathNums: number[] = BIPPath.fromString(path).toPathArray();
  return serializePath(pathNums);
};

/**
 * Chunks transaction data into APDU-sized payloads with derivation path in first chunk.
 *
 * Splits large transactions into MAX_CHUNK_SIZE (255 byte) chunks for APDU transmission.
 * The first chunk includes the serialized derivation path, subsequent chunks contain only data.
 *
 * @param path - BIP32 derivation path string
 * @param rawTx - Serialized transaction data
 * @returns Array of payload buffers ready for sequential APDU transmission
 */
export const serializeTransactionPayloadsWithDerivationPath = (
  path: string,
  rawTx: Buffer,
): Buffer[] => {
  const paths = splitPath(path);
  let offset = 0;
  const payloads: Buffer[] = [];
  const pathBuffer = Buffer.alloc(1 + paths.length * 4);
  pathBuffer[0] = paths.length;
  paths.forEach((element, index) => {
    pathBuffer.writeUInt32BE(element, 1 + 4 * index);
  });

  while (offset !== rawTx.length) {
    const first = offset === 0;
    const chunkSize =
      offset + MAX_CHUNK_SIZE > rawTx.length ? rawTx.length - offset : MAX_CHUNK_SIZE;

    const buffer = Buffer.alloc(first ? pathBuffer.length + chunkSize : chunkSize);

    if (first) {
      pathBuffer.copy(buffer, 0);
      rawTx.copy(buffer, pathBuffer.length, offset, offset + chunkSize);
    } else {
      rawTx.copy(buffer, 0, offset, offset + chunkSize);
    }

    payloads.push(buffer);
    offset += chunkSize;
  }
  return payloads;
};

/**
 * Chunks raw data into APDU-sized payloads without derivation path.
 *
 * Used for credential deployment attribute values and proofs which don't need path prefix.
 * Splits data into MAX_CHUNK_SIZE (255 byte) chunks for APDU transmission.
 *
 * @param rawTx - Raw data to chunk
 * @returns Array of payload buffers ready for sequential APDU transmission
 */
export const serializeTransactionPayloads = (rawTx: Buffer): Buffer[] => {
  let offset = 0;
  const payloads: Buffer[] = [];
  while (offset !== rawTx.length) {
    const chunkSize =
      offset + MAX_CHUNK_SIZE > rawTx.length ? rawTx.length - offset : MAX_CHUNK_SIZE;

    const buffer = Buffer.alloc(chunkSize);

    rawTx.copy(buffer, 0, offset, offset + chunkSize);

    payloads.push(buffer);
    offset += chunkSize;
  }
  return payloads;
};

/**
 * Serializes a transaction for hardware wallet signing.
 * @param txn - Account transaction with all fields prepared
 * @param path - BIP32 derivation path
 * @returns Object with payloads ready for APDU transmission
 */
export const serializeTransaction = (
  txn: AccountTransaction,
  path: string,
): { payloads: Buffer[] } => {
  const txSerialized = serializeAccountTransaction(txn);
  const payloads = serializeTransactionPayloadsWithDerivationPath(path, txSerialized);
  return { payloads };
};

function extractMemoFromPayload(serializedPayload: Buffer): Buffer {
  const memoLengthOffset = ACCOUNT_ADDRESS_LENGTH;
  const memoLengthBytes = serializedPayload.subarray(
    memoLengthOffset,
    memoLengthOffset + MEMO_LENGTH_SIZE,
  );
  const memoLength = memoLengthBytes.readUInt16BE(0);
  return serializedPayload.subarray(
    memoLengthOffset + MEMO_LENGTH_SIZE,
    memoLengthOffset + MEMO_LENGTH_SIZE + memoLength,
  );
}

function chunkBuffer(buffer: Buffer, maxSize: number): Buffer[] {
  const chunks: Buffer[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    const chunkSize = Math.min(maxSize, buffer.length - offset);
    chunks.push(Buffer.from(buffer.subarray(offset, offset + chunkSize)));
    offset += chunkSize;
  }
  return chunks;
}

/**
 * Serializes a TransferWithMemo transaction for hardware wallet signing.
 *
 * Expects hw-app format where payload is pre-serialized Buffer containing:
 * - 32 bytes: recipient address
 * - 2 bytes: memo length (u16 big-endian)
 * - N bytes: memo data
 * - 8 bytes: amount (u64 big-endian)
 *
 * @param txn - Account transaction in hw-app format with pre-serialized payload
 * @param path - BIP32 path for signing key
 * @returns Object with header, memo chunks, and amount payloads for APDU transmission
 */
export const serializeTransferWithMemo = (
  txn: AccountTransaction,
  path: string,
): {
  headerPayload: Buffer;
  memoPayloads: Buffer[];
  amountPayload: Buffer;
} => {
  // TransferWithMemo = 22
  if (txn.transactionType !== 22) {
    throw new Error("Transaction must be TransferWithMemo type (22)");
  }

  // Extract components from pre-serialized payload
  // Payload structure: [recipient:32][memoLength:2][memo:N][amount:8]
  const serializedRecipient = txn.payload.subarray(0, ACCOUNT_ADDRESS_LENGTH);
  const memoBuffer = extractMemoFromPayload(txn.payload);
  const memoLengthEncoded = encodeWord16(memoBuffer.length);

  // Amount is the last 8 bytes of the payload
  const serializedAmount = txn.payload.subarray(txn.payload.length - AMOUNT_SIZE);

  const pathBuffer = pathToBuffer(path);
  const serializedSender = txn.sender;
  const serializedNonce = encodeWord64(txn.nonce);
  const serializedEnergyAmount = encodeWord64(txn.energyAmount);
  const serializedExpiry = encodeWord64(txn.expiry);
  const serializedType = Buffer.from(Uint8Array.of(txn.transactionType));
  const payloadSize = 1 + txn.payload.length;

  const headerPayload = Buffer.concat([
    pathBuffer,
    serializedSender,
    serializedNonce,
    serializedEnergyAmount,
    encodeWord32(payloadSize),
    serializedExpiry,
    serializedType,
    serializedRecipient,
    memoLengthEncoded,
  ]);

  const memoPayloads = chunkBuffer(memoBuffer, MAX_CHUNK_SIZE);
  const amountPayload = serializedAmount;

  return {
    headerPayload,
    memoPayloads,
    amountPayload,
  };
};

/**
 * Serializes credential deployment values from CredentialDeploymentTransaction.
 *
 * Extracts and serializes the core credential data from hw-app format where:
 * - proofs are already serialized as hex string
 * - all hex fields (credId, verifyKey, etc.) are strings
 * - numeric fields are primitive types (number/bigint)
 *
 * @private
 * @param payload The credential deployment transaction in hw-app format
 * @returns Serialized credential data ready for chunking
 */
function serializeCredentialDeploymentValues(payload: CredentialDeploymentTransaction): Buffer {
  const buffers: Buffer[] = [];

  // Serialize credential public keys
  buffers.push(
    serializeMap(
      payload.credentialPublicKeys.keys,
      encodeWord8,
      encodeWord8FromString,
      serializeVerifyKey,
    ),
  );

  // Serialize threshold
  buffers.push(encodeWord8(payload.credentialPublicKeys.threshold));

  // Serialize credential ID
  buffers.push(Buffer.from(payload.credId, "hex"));

  // Serialize IP identity
  buffers.push(encodeWord32(payload.ipIdentity));

  // Serialize revocation threshold
  buffers.push(encodeWord8(payload.revocationThreshold));

  // Serialize anonymity revokers data
  buffers.push(
    serializeMap(
      payload.arData,
      encodeWord16,
      key => encodeWord32(parseInt(key, 10)),
      arData => Buffer.from(arData.encIdCredPubShare, "hex"),
    ),
  );

  // Serialize policy dates
  buffers.push(serializeYearMonth(payload.policy.validTo));
  buffers.push(serializeYearMonth(payload.policy.createdAt));

  // Serialize revealed attributes
  const revealedAttributes = Object.entries(payload.policy.revealedAttributes);
  buffers.push(encodeWord16(revealedAttributes.length));

  // Sort attributes by tag and serialize
  revealedAttributes
    .map(([tagName, value]) => ({
      tag: parseInt(tagName, 10), // Attribute tags are numeric indices
      value,
    }))
    .sort((a, b) => a.tag - b.tag)
    .forEach(({ tag, value }) => {
      const serializedAttributeValue = Buffer.from(value, "utf-8");
      const serializedTag = encodeWord8(tag);
      const serializedAttributeValueLength = encodeWord8(serializedAttributeValue.length);
      buffers.push(Buffer.concat([serializedTag, serializedAttributeValueLength]));
      buffers.push(serializedAttributeValue);
    });

  return Buffer.concat(buffers);
}

/**
 * Serializes a credential deployment transaction for hardware wallet signing.
 *
 * Takes hw-app format transaction and prepares it for transmission to device
 * by chunking it into appropriate APDU payloads.
 *
 * @param payload - Credential deployment transaction in hw-app format
 * @param path - BIP32 derivation path
 * @param metadata - Optional metadata (isNew flag, existing account address as Buffer)
 * @returns Structured payload components ready for APDU transmission
 */
export const serializeCredentialDeployment = (
  payload: CredentialDeploymentTransaction,
  path: string,
  metadata?: { isNew?: boolean; address?: Buffer },
) => {
  let offset = 0;
  const txSerialized = serializeCredentialDeploymentValues(payload);
  const payloadDerivationPath = pathToBuffer(path);

  const tag: Buffer[] = [];
  const valueLength: Buffer[] = [];
  const value: Buffer[] = [];

  const numberOfVerificationKeys = Buffer.from(
    txSerialized.subarray(offset, offset + INDEX_LENGTH),
  );
  offset += INDEX_LENGTH;
  const numKeys = numberOfVerificationKeys.readUInt8(0);

  const verificationKeys: Buffer[] = [];
  for (let i = 0; i < numKeys; i++) {
    verificationKeys.push(
      Buffer.from(txSerialized.subarray(offset, offset + 2 * ONE_OCTET_LENGTH + KEY_LENGTH)),
    );
    offset += 2 * ONE_OCTET_LENGTH + KEY_LENGTH;
  }

  const threshold = Buffer.from(txSerialized.subarray(offset, offset + ONE_OCTET_LENGTH));
  offset += ONE_OCTET_LENGTH;

  const credId = Buffer.from(txSerialized.subarray(offset, offset + CREDENTIAL_ID_LENGTH));
  offset += CREDENTIAL_ID_LENGTH;

  const ipIdentity = Buffer.from(txSerialized.subarray(offset, offset + IP_IDENTITY_LENGTH));
  offset += IP_IDENTITY_LENGTH;

  const revocationThreshold = Buffer.from(txSerialized.subarray(offset, offset + ONE_OCTET_LENGTH));
  offset += ONE_OCTET_LENGTH;

  const arDataLength = Buffer.from(txSerialized.subarray(offset, offset + AR_DATA_LENGTH));
  offset += AR_DATA_LENGTH;
  const numArDataEntries = arDataLength.readUInt16BE(0);

  const thresholdAndRegIdAndIPIdentity = Buffer.concat([
    threshold,
    credId,
    ipIdentity,
    revocationThreshold,
    arDataLength,
  ]);

  const arDataEntrySize = 4 + ID_CRED_PUB_SHARE_LENGTH;
  const encIdCredPubShareAndKey: Buffer[] = [];
  for (let i = 0; i < numArDataEntries; i++) {
    encIdCredPubShareAndKey.push(
      Buffer.from(txSerialized.subarray(offset, offset + arDataEntrySize)),
    );
    offset += arDataEntrySize;
  }

  const validToAndCreatedAtAndAttributesLength = Buffer.from(
    txSerialized.subarray(offset, offset + ATTRIBUTES_LENGTH + VALID_TO_LENGTH + CREATED_AT_LENGTH),
  );
  offset += ATTRIBUTES_LENGTH + VALID_TO_LENGTH + CREATED_AT_LENGTH;
  const attributesLength = validToAndCreatedAtAndAttributesLength.subarray(-ATTRIBUTES_LENGTH);
  const numAttributes = attributesLength.readUInt16BE(0);

  for (let j = 0; j < numAttributes; j++) {
    tag.push(Buffer.from(txSerialized.subarray(offset, offset + TAG_LENGTH)));
    offset += TAG_LENGTH;
    valueLength.push(Buffer.from(txSerialized.subarray(offset, offset + VALUE_LENGTH)));
    offset += VALUE_LENGTH;
    const valueLen = valueLength[j].readUInt8(0);
    value.push(Buffer.from(txSerialized.subarray(offset, offset + valueLen)));
    offset += valueLen;
  }

  // In hw-app format, proofs come pre-serialized as hex string
  // (transformed from SDK IdOwnershipProofs object by coin-concordium layer)
  const serializedProofs = Buffer.from(payload.proofs, "hex");
  const proofLength = encodeWord32(serializedProofs.length);
  const proofs = serializedProofs;

  let newOrExistingPayload: Buffer | undefined;
  if (metadata?.isNew !== undefined) {
    if (metadata.isNew) {
      const expiryBuf = encodeWord64(payload.expiry);
      newOrExistingPayload = Buffer.concat([Buffer.from([0x00]), expiryBuf]);
    } else if (metadata.address) {
      newOrExistingPayload = Buffer.concat([Buffer.from([0x01]), metadata.address]);
    }
  }

  return {
    payloadDerivationPath,
    numberOfVerificationKeys,
    verificationKeys,
    thresholdAndRegIdAndIPIdentity,
    encIdCredPubShareAndKey,
    validToAndCreatedAtAndAttributesLength,
    attributesLength,
    tag,
    valueLength,
    value,
    proofLength,
    proofs,
    newOrExistingPayload,
  };
};
