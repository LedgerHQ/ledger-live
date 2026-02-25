import {
  TransactionType,
  type CredentialDeploymentTransaction,
  serializeCredentialDeploymentValues,
  serializeIdOwnershipProofs,
  pathToBuffer,
  chunkBuffer,
  encodeWord64,
} from "@ledgerhq/concordium-core";

export const MAX_CHUNK_SIZE = 255;

/**
 * Prepares Transfer APDU payloads for device signing.
 *
 * Transfer uses standard APDU sequence with chunking (255 bytes per chunk).
 * Path is prepended ONLY to the first chunk.
 *
 * @param serialized Serialized Transfer transaction
 * @param path BIP32 path for signing key
 * @returns APDU payloads ready for device transmission (chunked)
 */
export const prepareTransferAPDU = (serialized: Buffer, path: string): Buffer[] => {
  const pathBuffer = pathToBuffer(path);

  // Validate path buffer fits within APDU limit
  if (pathBuffer.length >= MAX_CHUNK_SIZE) {
    throw new Error(
      `BIP32 path too long: ${pathBuffer.length} bytes exceeds maximum ${MAX_CHUNK_SIZE - 1}`,
    );
  }

  let offset = 0;
  const payloads: Buffer[] = [];

  while (offset !== serialized.length) {
    const first = offset === 0;
    // For first chunk, leave room for path buffer to stay within APDU limit
    const maxChunk = first ? MAX_CHUNK_SIZE - pathBuffer.length : MAX_CHUNK_SIZE;
    const chunkSize = offset + maxChunk > serialized.length ? serialized.length - offset : maxChunk;

    const buffer = Buffer.alloc(first ? pathBuffer.length + chunkSize : chunkSize);

    if (first) {
      pathBuffer.copy(buffer, 0);
      serialized.copy(buffer, pathBuffer.length, offset, offset + chunkSize);
    } else {
      serialized.copy(buffer, 0, offset, offset + chunkSize);
    }

    payloads.push(buffer);
    offset += chunkSize;
  }

  return payloads;
};

/**
 * Prepares TransferWithMemo APDU payloads for device signing.
 *
 * TransferWithMemo requires a special 3-step APDU sequence:
 * 1. Header + recipient + memo length
 * 2. Memo chunks (255 bytes each)
 * 3. Amount
 *
 * @param serialized Serialized TransferWithMemo transaction
 * @param path BIP32 path for signing key
 * @returns Object with headerPayload, memoPayloads array, and amountPayload
 */
export const prepareTransferWithMemoAPDU = (
  serialized: Buffer,
  path: string,
): {
  headerPayload: Buffer;
  memoPayloads: Buffer[];
  amountPayload: Buffer;
} => {
  // Parse serialized transaction:
  // [sender:32][nonce:8][energy:8][payload_size:4][expiry:8][type:1]
  // [recipient:32][memo_length:2][memo:N][amount:8]

  // Validate minimum length for header + recipient + memo_length
  const minLength = 32 + 8 + 8 + 4 + 8 + 1 + 32 + 2;
  if (serialized.length < minLength) {
    throw new Error(
      `Invalid TransferWithMemo buffer: expected at least ${minLength} bytes, got ${serialized.length}`,
    );
  }

  let offset = 0;
  const sender = serialized.subarray(offset, offset + 32);
  offset += 32;
  const nonce = serialized.subarray(offset, offset + 8);
  offset += 8;
  const energy = serialized.subarray(offset, offset + 8);
  offset += 8;
  const payloadSize = serialized.subarray(offset, offset + 4);
  offset += 4;
  const expiry = serialized.subarray(offset, offset + 8);
  offset += 8;
  const type = serialized.subarray(offset, offset + 1);
  offset += 1;

  // Validate transaction type is TransferWithMemo
  if (type[0] !== TransactionType.TransferWithMemo) {
    throw new Error(
      `Invalid transaction type: expected TransferWithMemo (${TransactionType.TransferWithMemo}), got ${type[0]}`,
    );
  }

  const recipient = serialized.subarray(offset, offset + 32);
  offset += 32;

  const memoLength = serialized.readUInt16BE(offset);
  const memoLengthBytes = serialized.subarray(offset, offset + 2);
  offset += 2;

  // Validate payload size is consistent with memo length
  // Payload: [type:1][recipient:32][memo_length:2][memo:N][amount:8]
  const expectedPayloadSize = 1 + 32 + 2 + memoLength + 8;
  const actualPayloadSize = payloadSize.readUInt32BE(0);
  if (actualPayloadSize !== expectedPayloadSize) {
    throw new Error(
      `Invalid payload size: expected ${expectedPayloadSize} bytes (type:1 + recipient:32 + memo_length:2 + memo:${memoLength} + amount:8), got ${actualPayloadSize}`,
    );
  }

  // Validate buffer has space for memo + amount
  if (offset + memoLength + 8 > serialized.length) {
    throw new Error(
      `Invalid TransferWithMemo buffer: expected ${offset + memoLength + 8} bytes for memo (${memoLength}) + amount (8), got ${serialized.length}`,
    );
  }
  const memo = serialized.subarray(offset, offset + memoLength);
  offset += memoLength;
  const amount = serialized.subarray(offset, offset + 8);

  const pathBuffer = pathToBuffer(path);

  // Validate header payload will fit within APDU limit
  // Fixed header size: sender(32) + nonce(8) + energy(8) + payloadSize(4) + expiry(8) + type(1) + recipient(32) + memoLength(2) = 95 bytes
  const FIXED_HEADER_SIZE = 95;
  const headerSize = pathBuffer.length + FIXED_HEADER_SIZE;
  if (headerSize > MAX_CHUNK_SIZE) {
    throw new Error(
      `Header payload exceeds APDU limit: ${headerSize} bytes (path: ${pathBuffer.length} + fixed: ${FIXED_HEADER_SIZE}) > ${MAX_CHUNK_SIZE}`,
    );
  }

  // Build header payload: path + sender + nonce + energy + payload_size + expiry + type + recipient + memo_length
  const headerPayload = Buffer.concat([
    pathBuffer,
    sender,
    nonce,
    energy,
    payloadSize,
    expiry,
    type,
    recipient,
    memoLengthBytes,
  ]);

  // Chunk memo into MAX_CHUNK_SIZE byte pieces
  const memoPayloads = chunkBuffer(memo, MAX_CHUNK_SIZE);

  return {
    headerPayload,
    memoPayloads,
    amountPayload: amount,
  };
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
 * Serializes a credential deployment transaction for hardware wallet signing.
 *
 * Takes hw-app format transaction and prepares it for transmission to device
 * by chunking it into appropriate APDU payloads.
 *
 * Always creates credentials for new accounts on existing identities (Ledger Live use case).
 * The device receives the expiry time to display for user verification.
 *
 * @param tx - Credential deployment transaction in hw-app format
 * @param path - BIP32 derivation path
 * @returns Structured payload components ready for APDU transmission
 */
export const serializeCredentialDeployment = (
  tx: CredentialDeploymentTransaction,
  path: string,
) => {
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

  let offset = 0;
  const txSerialized = serializeCredentialDeploymentValues(tx);
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

  // Serialize ID ownership proofs - device needs to include these in signature hash
  const serializedProofs = serializeIdOwnershipProofs(tx.proofs);
  const proofLength = Buffer.alloc(4);
  proofLength.writeUInt32BE(serializedProofs.length, 0);
  const proofs = serializedProofs;

  // Always send expiry for new account (Ledger Live only creates new accounts)
  // Format: [0x00] (new account indicator) + expiry (8 bytes)
  const expiryBuf = encodeWord64(tx.expiry);
  const newOrExistingPayload = Buffer.concat([Buffer.from([0x00]), expiryBuf]);

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
