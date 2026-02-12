import {
  TransactionType,
  type Transaction,
  type CredentialDeploymentTransaction,
  type IdOwnershipProofs,
} from "./types";
import {
  chunkBuffer,
  decodeWord16,
  decodeWord32,
  decodeWord64,
  encodeWord16,
  encodeWord32,
  encodeWord64,
  encodeWord8,
  encodeWord8FromString,
  pathToBuffer,
  serializeMap,
  serializeVerifyKey,
  serializeYearMonth,
} from "./utils";
import { AccountAddress } from "./address";
import { MAX_CBOR_SIZE } from "./cbor";

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

/**
 * Serializes transaction header common to all account transaction types.
 *
 * Format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8]
 * @private
 */
function serializeTransactionHeader(tx: Transaction, payload: Buffer): Buffer {
  const serializedSender = tx.header.sender.toBuffer();
  const serializedNonce = encodeWord64(tx.header.nonce);
  const serializedEnergyAmount = encodeWord64(tx.header.energyAmount);
  const serializedPayloadSize = encodeWord32(payload.length + 1);
  const serializedExpiry = encodeWord64(tx.header.expiry);

  return Buffer.concat([
    serializedSender,
    serializedNonce,
    serializedEnergyAmount,
    serializedPayloadSize,
    serializedExpiry,
  ]);
}

/**
 * Serializes a Transfer transaction (simple transfer without memo).
 *
 * Output format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1][recipient:32][amount:8]
 *
 * @param tx Transfer transaction
 * @returns Serialized transaction ready for network submission
 */
export const serializeTransfer = (tx: Transaction): Buffer => {
  if (tx.type !== TransactionType.Transfer) {
    throw new Error("Transaction must be Transfer type");
  }

  // Transfer payload: [32 bytes recipient][8 bytes amount]
  const serializedPayload = Buffer.concat([
    tx.payload.toAddress.toBuffer(),
    encodeWord64(tx.payload.amount),
  ]);

  const serializedHeader = serializeTransactionHeader(tx, serializedPayload);
  const serializedType = Buffer.from([tx.type]);

  return Buffer.concat([serializedHeader, serializedType, serializedPayload]);
};

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
 * Serializes a TransferWithMemo transaction (transfer with memo).
 *
 * Output format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1][recipient:32][memo_length:2][memo:N][amount:8]
 *
 * @param tx TransferWithMemo transaction
 * @returns Serialized transaction ready for network submission
 */
export const serializeTransferWithMemo = (tx: Transaction): Buffer => {
  if (tx.type !== TransactionType.TransferWithMemo) {
    throw new Error("Transaction must be TransferWithMemo type");
  }

  if (!("memo" in tx.payload)) {
    throw new Error("TransferWithMemo payload must contain memo");
  }

  // Validate memo respects device/protocol limit
  // Memo must be CBOR-encoded and ≤ 256 bytes (device firmware limit)
  if (tx.payload.memo.length > MAX_CBOR_SIZE) {
    throw new Error(
      `Memo size ${tx.payload.memo.length} bytes exceeds device limit of ${MAX_CBOR_SIZE} bytes (must be CBOR-encoded)`,
    );
  }

  // TransferWithMemo payload: [32 bytes recipient][2 bytes memo_length][N bytes memo][8 bytes amount]
  const serializedPayload = Buffer.concat([
    tx.payload.toAddress.toBuffer(),
    encodeWord16(tx.payload.memo.length),
    tx.payload.memo,
    encodeWord64(tx.payload.amount),
  ]);

  const serializedHeader = serializeTransactionHeader(tx, serializedPayload);
  const serializedType = Buffer.from([tx.type]);

  return Buffer.concat([serializedHeader, serializedType, serializedPayload]);
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

  // Validate buffer has space for memo_length field
  if (offset + 2 > serialized.length) {
    throw new Error(
      `Invalid TransferWithMemo buffer: insufficient data for memo_length at offset ${offset}`,
    );
  }
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
 * Serializes credential deployment values from CredentialDeploymentTransaction.
 *
 * Extracts and serializes the core credential data from hw-app format where:
 * - all hex fields (credId, verifyKey, etc.) are strings
 * - numeric fields are primitive types (number/bigint)
 *
 * Note: This function does NOT serialize proofs. Proofs are serialized separately
 * in serializeCredentialDeployment() via serializeIdOwnershipProofs().
 *
 * @private
 * @param payload The credential deployment transaction in hw-app format
 * @returns Serialized credential data ready for chunking
 */
export function serializeCredentialDeploymentValues(
  payload: CredentialDeploymentTransaction,
): Buffer {
  const buffers: Buffer[] = [];

  // Serialize credential public keys
  const keysBuffer = serializeMap(
    payload.credentialPublicKeys.keys,
    encodeWord8,
    encodeWord8FromString,
    serializeVerifyKey,
  );
  buffers.push(keysBuffer);
  buffers.push(encodeWord8(payload.credentialPublicKeys.threshold));

  // Serialize credential ID
  buffers.push(Buffer.from(payload.credId, "hex"));

  // Serialize IP identity
  buffers.push(encodeWord32(payload.ipIdentity));

  // Serialize revocation threshold
  buffers.push(encodeWord8(payload.revocationThreshold));

  // Serialize anonymity revokers data
  const arDataBuffer = serializeMap(
    payload.arData,
    encodeWord16,
    key => encodeWord32(Number.parseInt(key, 10)),
    arData => Buffer.from(arData.encIdCredPubShare, "hex"),
  );
  buffers.push(arDataBuffer);
  buffers.push(serializeYearMonth(payload.policy.validTo));
  buffers.push(serializeYearMonth(payload.policy.createdAt));

  // Serialize revealed attributes
  const revealedAttributes = Object.entries(payload.policy.revealedAttributes);
  buffers.push(encodeWord16(revealedAttributes.length));

  // Sort attributes by tag and serialize
  const attributes = revealedAttributes.map(([tagName, value]) => ({
    tag: Number.parseInt(tagName, 10), // Attribute tags are numeric indices
    value,
  }));
  attributes.sort((a, b) => a.tag - b.tag);
  attributes.forEach(({ tag, value }) => {
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
  const proofLength = encodeWord32(serializedProofs.length);
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

/**
 * Serializes the common prefix of ID ownership proofs up to and including proofRegId.
 *
 * This helper extracts the shared serialization logic used by both `serializeIdOwnershipProofs`
 * and `insertAccountOwnershipProofs` to ensure they stay in sync.
 *
 * Serialization order:
 * 1. sig (IP signature)
 * 2. commitments
 * 3. challenge
 * 4. proofIdCredPub (u32 count + map entries with u32 keys, sorted by index)
 * 5. proofIpSig (identity provider signature proof)
 * 6. proofRegId (registration ID proof)
 *
 * @param proofs - ID ownership proofs from Concordium ID App
 * @returns Serialized prefix buffer (everything up to and including proofRegId)
 */
function serializeIdOwnershipProofsPrefix(proofs: IdOwnershipProofs): Buffer {
  const proofIdCredPubEntries = Object.entries(proofs.proofIdCredPub);
  proofIdCredPubEntries.sort(
    ([indexA], [indexB]) => Number.parseInt(indexA, 10) - Number.parseInt(indexB, 10),
  );
  const proofIdCredPubLength = encodeWord32(proofIdCredPubEntries.length);
  const idCredPubProofs = Buffer.concat(
    proofIdCredPubEntries.map(([index, value]) => {
      const serializedIndex = encodeWord32(Number.parseInt(index, 10));
      const serializedValue = Buffer.from(value, "hex");
      return Buffer.concat([serializedIndex, serializedValue]);
    }),
  );

  return Buffer.concat([
    Buffer.from(proofs.sig, "hex"),
    Buffer.from(proofs.commitments, "hex"),
    Buffer.from(proofs.challenge, "hex"),
    proofIdCredPubLength,
    idCredPubProofs,
    Buffer.from(proofs.proofIpSig, "hex"),
    Buffer.from(proofs.proofRegId, "hex"),
  ]);
}

/**
 * Serializes ID ownership proofs for credential deployment.
 *
 * This function serializes the identity ownership proofs received from the Concordium ID App
 * into the binary format required for credential deployment transactions. It handles the
 * ID ownership portion only - account ownership proofs must be inserted separately using
 * `insertAccountOwnershipProofs()`.
 *
 * Used as part of the credential deployment flow:
 * 1. Get ID ownership proofs from Concordium ID App
 * 2. Serialize them with this function
 * 3. Sign with device using `signCredentialDeployment()`
 * 4. Insert account ownership proofs using `insertAccountOwnershipProofs()`
 * 5. Submit complete credential deployment to blockchain
 *
 * @param proofs - ID ownership proofs from Concordium ID App
 * @returns Serialized ID ownership proofs as Buffer
 *
 * @see insertAccountOwnershipProofs for combining ID and account proofs
 */
export function serializeIdOwnershipProofs(proofs: IdOwnershipProofs): Buffer {
  const prefix = serializeIdOwnershipProofsPrefix(proofs);

  // NOTE: Account ownership proofs are NOT included here.
  // They must be inserted between proofRegId and credCounterLessThanMaxAccounts.
  return Buffer.concat([prefix, Buffer.from(proofs.credCounterLessThanMaxAccounts, "hex")]);
}

/**
 * Serializes account ownership proofs from Ed25519 signatures.
 *
 * Structure (matching Concordium node expectations):
 * - Number of signatures (1 byte, u8)
 * - For each signature:
 *   - Key index (1 byte, u8)
 *   - Signature (64 bytes for Ed25519)
 *
 * @param signatures - Array of Ed25519 signatures as hex strings
 * @returns Serialized account ownership proofs as Buffer
 */
export function serializeAccountOwnershipProofs(signatures: string[]): Buffer {
  const numSignatures = encodeWord8(signatures.length);

  const serializedSignatures = signatures.map((sig, i) => {
    const keyIndex = encodeWord8(i);
    const signature = Buffer.from(sig, "hex");

    if (signature.length !== 64) {
      throw new Error(
        `Invalid signature length at index ${i}: expected 64 bytes, got ${signature.length}`,
      );
    }

    return Buffer.concat([keyIndex, signature]);
  });

  return Buffer.concat([numSignatures, ...serializedSignatures]);
}

/**
 * Inserts account ownership proofs into ID ownership proofs to build complete CredDeploymentProofs.
 *
 * This function is critical for credential deployment. It takes the ID ownership proofs
 * from the Concordium ID App and the account ownership signature from the Ledger device,
 * then combines them into the complete proof structure required by the Concordium blockchain.
 *
 * ## Why Insertion Order Matters
 * The Concordium protocol defines a specific serialization order for CredDeploymentProofs.
 * The account ownership proofs MUST be inserted at position 7 (between proofRegId and credCounterLessThanMaxAccounts),
 * not appended at the end.
 *
 * Incorrect ordering will cause the blockchain node to reject the credential with the error:
 * "Credential rejected by the node"
 *
 * ## Serialization Order
 * 1. sig (IP signature)
 * 2. commitments
 * 3. challenge
 * 4. proofIdCredPub (u32 count + map entries with u32 keys, sorted by index)
 * 5. proofIpSig (identity provider signature proof)
 * 6. proofRegId (registration ID proof)
 * 7. **proof_acc_sk (AccountOwnershipProof) ← INSERTED HERE**
 * 8. credCounterLessThanMaxAccounts
 *
 * @param idProofs - ID ownership proofs from the Concordium ID App
 * @param accountSignature - Account ownership signature from the Ledger device (hex string, 64 bytes)
 * @returns Complete CredDeploymentProofs as hex string, ready for submission
 */
export function insertAccountOwnershipProofs(
  idProofs: IdOwnershipProofs,
  accountSignature: string,
): string {
  const prefix = serializeIdOwnershipProofsPrefix(idProofs);
  const accountProofBuffer = serializeAccountOwnershipProofs([accountSignature]);

  const combined = Buffer.concat([
    prefix,
    accountProofBuffer,
    Buffer.from(idProofs.credCounterLessThanMaxAccounts, "hex"),
  ]);

  return combined.toString("hex");
}

/**
 * Deserializes a Transfer transaction from serialized buffer.
 *
 * Parses the binary format and reconstructs the structured Transaction object.
 * Expected format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1][recipient:32][amount:8]
 *
 * @param buffer Serialized Transfer transaction
 * @returns Structured Transaction with all fields populated
 */
export const deserializeTransfer = (buffer: Buffer): Transaction => {
  let offset = 0;

  const sender = AccountAddress.fromBuffer(buffer.subarray(offset, offset + 32));
  offset += 32;

  const nonce = decodeWord64(buffer, offset);
  offset += 8;

  const energyAmount = decodeWord64(buffer, offset);
  offset += 8;

  const payloadSize = decodeWord32(buffer, offset);
  offset += 4;

  const expiry = decodeWord64(buffer, offset);
  offset += 8;

  const type = buffer[offset];
  offset += 1;

  if (type !== TransactionType.Transfer) {
    throw new Error(`Expected Transfer type (3), got ${type}`);
  }

  const toAddress = AccountAddress.fromBuffer(buffer.subarray(offset, offset + 32));
  offset += 32;

  const amount = decodeWord64(buffer, offset);

  const expectedPayloadSize = 32 + 8;
  if (payloadSize !== expectedPayloadSize + 1) {
    throw new Error(
      `Invalid payload size for Transfer: expected ${expectedPayloadSize + 1}, got ${payloadSize}`,
    );
  }

  return {
    header: {
      sender,
      nonce,
      expiry,
      energyAmount,
    },
    type: TransactionType.Transfer,
    payload: {
      toAddress,
      amount,
    },
  };
};

/**
 * Deserializes a TransferWithMemo transaction from serialized buffer.
 *
 * Parses the binary format and reconstructs the structured Transaction object with memo.
 * Expected format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1][recipient:32][memo_length:2][memo:N][amount:8]
 *
 * @param buffer Serialized TransferWithMemo transaction
 * @returns Structured Transaction with all fields including memo
 */
export const deserializeTransferWithMemo = (buffer: Buffer): Transaction => {
  let offset = 0;

  const sender = AccountAddress.fromBuffer(buffer.subarray(offset, offset + 32));
  offset += 32;

  const nonce = decodeWord64(buffer, offset);
  offset += 8;

  const energyAmount = decodeWord64(buffer, offset);
  offset += 8;

  const payloadSize = decodeWord32(buffer, offset);
  offset += 4;

  const expiry = decodeWord64(buffer, offset);
  offset += 8;

  const type = buffer[offset];
  offset += 1;

  if (type !== TransactionType.TransferWithMemo) {
    throw new Error(`Expected TransferWithMemo type (22), got ${type}`);
  }

  const toAddress = AccountAddress.fromBuffer(buffer.subarray(offset, offset + 32));
  offset += 32;

  const memoLength = decodeWord16(buffer, offset);
  offset += 2;

  const memo = Buffer.from(buffer.subarray(offset, offset + memoLength));
  offset += memoLength;

  const amount = decodeWord64(buffer, offset);

  const expectedPayloadSize = 32 + 2 + memoLength + 8;
  if (payloadSize !== expectedPayloadSize + 1) {
    throw new Error(
      `Invalid payload size for TransferWithMemo: expected ${expectedPayloadSize + 1}, got ${payloadSize}`,
    );
  }

  return {
    header: {
      sender,
      nonce,
      expiry,
      energyAmount,
    },
    type: TransactionType.TransferWithMemo,
    payload: {
      toAddress,
      amount,
      memo,
    },
  };
};

/**
 * Gets the transaction type from a serialized transaction buffer.
 *
 * Common header format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1]
 * The type byte is at offset 60 (32+8+8+4+8).
 *
 * Payload structure varies by type:
 * - Transfer (0x03): [recipient:32][amount:8]
 * - TransferWithMemo (0x16): [recipient:32][memo_length:2][memo:N][amount:8]
 *
 * @param buffer - Serialized transaction buffer
 * @returns The transaction type
 * @throws Error if buffer is too short or type is invalid
 */
export function getTransactionType(buffer: Buffer): TransactionType {
  const TYPE_OFFSET = 60; // 32 (sender) + 8 (nonce) + 8 (energy) + 4 (payloadSize) + 8 (expiry)

  if (buffer.length <= TYPE_OFFSET) {
    throw new Error(
      `Transaction buffer too short: expected at least ${TYPE_OFFSET + 1} bytes, got ${buffer.length}`,
    );
  }

  const type = buffer.readUInt8(TYPE_OFFSET);

  if (type !== TransactionType.Transfer && type !== TransactionType.TransferWithMemo) {
    throw new Error(
      `Unsupported transaction type: ${type} (0x${type.toString(16)}). Expected Transfer (${TransactionType.Transfer}) or TransferWithMemo (${TransactionType.TransferWithMemo})`,
    );
  }

  return type;
}

/**
 * Deserializes a transaction buffer by automatically detecting its type.
 *
 * @param buffer - Serialized transaction buffer
 * @returns The deserialized transaction
 * @throws Error if buffer is invalid or type is unsupported
 */
export function deserializeTransaction(buffer: Buffer): Transaction {
  const type = getTransactionType(buffer);

  switch (type) {
    case TransactionType.Transfer:
      return deserializeTransfer(buffer);
    case TransactionType.TransferWithMemo:
      return deserializeTransferWithMemo(buffer);
    default:
      // This should never happen since getTransactionType validates the type
      throw new Error(`Unexpected transaction type: ${type}`);
  }
}

/**
 * Serializes a transaction by automatically using the correct serializer based on its type.
 *
 * @param transaction - The transaction to serialize
 * @returns The serialized transaction buffer
 * @throws Error if transaction type is unsupported
 */
export function serializeTransaction(transaction: Transaction): Buffer {
  switch (transaction.type) {
    case TransactionType.Transfer:
      return serializeTransfer(transaction);
    case TransactionType.TransferWithMemo:
      return serializeTransferWithMemo(transaction);
    default:
      throw new Error(`Unsupported transaction type for serialization: ${transaction.type}`);
  }
}
