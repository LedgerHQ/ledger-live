import BIPPath from "bip32-path";
import type { AccountTransaction, CredentialDeploymentTransaction } from "./types";
import {
  chunkBuffer,
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
  const paths = BIPPath.fromString(path).toPathArray();
  let offset = 0;
  const payloads: Buffer[] = [];
  const pathBuffer = Buffer.alloc(1 + paths.length * 4);
  pathBuffer[0] = paths.length;
  paths.forEach((element: number, index: number) => {
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
 * @param tx - Account transaction with all fields prepared
 * @param path - BIP32 derivation path
 * @returns Object with payloads ready for APDU transmission
 */
export const serializeTransaction = (
  tx: AccountTransaction,
  path: string,
): { payloads: Buffer[] } => {
  const txSerialized = serializeAccountTransaction(tx);
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

/**
 * Serializes a TransferWithMemo transaction for hardware wallet signing.
 *
 * Expects hw-app format where payload is pre-serialized Buffer containing:
 * - 32 bytes: recipient address
 * - 2 bytes: memo length (u16 big-endian)
 * - N bytes: memo data
 * - 8 bytes: amount (u64 big-endian)
 *
 * @param tx - Account transaction in hw-app format with pre-serialized payload
 * @param path - BIP32 path for signing key
 * @returns Object with header, memo chunks, and amount payloads for APDU transmission
 */
export const serializeTransferWithMemo = (
  tx: AccountTransaction,
  path: string,
): {
  headerPayload: Buffer;
  memoPayloads: Buffer[];
  amountPayload: Buffer;
} => {
  // TransferWithMemo = 22
  if (tx.transactionType !== 22) {
    throw new Error("Transaction must be TransferWithMemo type (22)");
  }

  // Extract components from pre-serialized payload
  // Payload structure: [recipient:32][memoLength:2][memo:N][amount:8]
  const serializedRecipient = tx.payload.subarray(0, ACCOUNT_ADDRESS_LENGTH);
  const memoBuffer = extractMemoFromPayload(tx.payload);
  const memoLengthEncoded = encodeWord16(memoBuffer.length);

  // Amount is the last 8 bytes of the payload
  const serializedAmount = tx.payload.subarray(tx.payload.length - AMOUNT_SIZE);

  const pathBuffer = pathToBuffer(path);
  const serializedSender = tx.sender;
  const serializedNonce = encodeWord64(tx.nonce);
  const serializedEnergyAmount = encodeWord64(tx.energyAmount);
  const serializedExpiry = encodeWord64(tx.expiry);
  const serializedType = Buffer.from(Uint8Array.of(tx.transactionType));
  const payloadSize = 1 + tx.payload.length;

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
    key => encodeWord32(parseInt(key, 10)),
    arData => Buffer.from(arData.encIdCredPubShare, "hex"),
  );
  buffers.push(arDataBuffer);
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
 * Serializes IdOwnershipProofs to Buffer format.
 * @private
 * @param proofs the IdOwnershipProofs object to serialize
 * @returns serialized proofs as Buffer
 */
/**
 * Serializes IdOwnershipProofs WITHOUT account ownership proofs.
 *
 * IMPORTANT: This serializes ONLY the ID ownership proofs portion.
 * The account ownership proofs must be inserted AFTER proofRegId and BEFORE
 * credCounterLessThanMaxAccounts when building the complete CredDeploymentProofs.
 *
 * Returns an object with the parts so they can be combined in correct order.
 */
export function serializeIdOwnershipProofs(proofs: {
  sig: string;
  commitments: string;
  challenge: string;
  proofIdCredPub: Record<string, string>;
  proofIpSig: string;
  proofRegId: string;
  credCounterLessThanMaxAccounts: string;
}): Buffer {
  const proofIdCredPubEntries = Object.entries(proofs.proofIdCredPub);
  const proofIdCredPubLength = encodeWord32(proofIdCredPubEntries.length);
  const idCredPubProofs = Buffer.concat(
    proofIdCredPubEntries
      .sort(([indexA], [indexB]) => parseInt(indexA, 10) - parseInt(indexB, 10))
      .map(([index, value]) => {
        const serializedIndex = encodeWord32(parseInt(index, 10));
        const serializedValue = Buffer.from(value, "hex");
        return Buffer.concat([serializedIndex, serializedValue]);
      }),
  );

  // NOTE: Account ownership proofs are NOT included here.
  // They must be inserted between proofRegId and credCounterLessThanMaxAccounts.
  return Buffer.concat([
    Buffer.from(proofs.sig, "hex"),
    Buffer.from(proofs.commitments, "hex"),
    Buffer.from(proofs.challenge, "hex"),
    proofIdCredPubLength,
    idCredPubProofs,
    Buffer.from(proofs.proofIpSig, "hex"),
    Buffer.from(proofs.proofRegId, "hex"),
    Buffer.from(proofs.credCounterLessThanMaxAccounts, "hex"),
  ]);
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
