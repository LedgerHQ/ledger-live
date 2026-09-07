import {
  TransactionType,
  type AnyTransaction,
  type Transaction,
  type TokenUpdatePayload,
  type TokenUpdateTransaction,
  type TransactionHeader,
  type CredentialDeploymentTransaction,
  type IdOwnershipProofs,
} from "./types";
import {
  decodeWord16,
  decodeWord32,
  decodeWord64,
  encodeWord16,
  encodeWord32,
  encodeWord64,
  encodeWord8,
  encodeWord8FromString,
  serializeMap,
  serializeVerifyKey,
  serializeYearMonth,
} from "./utils";
import { AccountAddress } from "./address";
import {
  MAX_CBOR_SIZE,
  PLT_CBOR_MAX_SIZE,
  PLT_TOKEN_ID_MAX_LENGTH,
  PLT_TOKEN_ID_MIN_LENGTH,
} from "./cbor";

/**
 * Serializes transaction header common to all account transaction types.
 *
 * Format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8]
 * @private
 */
function serializeTransactionHeader(tx: { header: TransactionHeader }, payload: Buffer): Buffer {
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
 * CBOR head for a definite-length array of exactly one item. CIS-7 allows an
 * array of operations; the device accepts only one element.
 * @private
 */
const CBOR_SINGLE_ELEMENT_ARRAY = 0x81;

/**
 * Narrows a transaction to the PLT shape.
 *
 * The type discriminator alone is not enough: a JS caller or an unsafe cast can
 * produce an object that claims to be `TokenUpdate` while carrying a CCD
 * payload. The payload checks reject that instead of letting it reach the PLT
 * serializer.
 */
export function isTokenUpdateTransaction(
  transaction: AnyTransaction,
): transaction is TokenUpdateTransaction {
  return (
    transaction?.type === TransactionType.TokenUpdate && hasTokenUpdatePayload(transaction.payload)
  );
}

/**
 * The `in` operator throws on a null or primitive operand, so the object check
 * comes first: the public type guard above must return false for a malformed
 * input rather than throw.
 *
 * Presence alone would let a payload with string fields satisfy the guard and
 * reach the serializer, where it fails on `readUInt8` only after passing the
 * length bounds.
 * @private
 */
function hasTokenUpdatePayload(payload: unknown): payload is TokenUpdatePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "tokenId" in payload &&
    "operations" in payload &&
    Buffer.isBuffer(payload.tokenId) &&
    Buffer.isBuffer(payload.operations)
  );
}

/**
 * Serializes a TokenUpdate transaction — a Protocol-Level Token (PLT) operation.
 *
 * Output format:
 * `[sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1][token_id_length:1][token_id:N][cbor_length:4][cbor:M]`
 *
 * All multi-byte fields are big-endian.
 *
 * This is the flat wire transaction: the same bytes the chain accepts and the
 * device hashes. The signer re-splits it into APDU frames, so nothing else needs
 * to know the framing.
 *
 * Every bound checked here mirrors one the device enforces. Failing locally
 * turns an opaque status word mid-signing into a clear error before the user is
 * prompted.
 *
 * @param tx TokenUpdate transaction
 * @returns Serialized transaction ready for signing and network submission
 * @throws If the payload is not a PLT payload, or the token id or operations blob is outside the device's limits
 */
export const serializeTokenUpdate = (tx: TokenUpdateTransaction): Buffer => {
  if (tx.type !== TransactionType.TokenUpdate) {
    throw new Error("Transaction must be TokenUpdate type");
  }

  if (!hasTokenUpdatePayload(tx.payload)) {
    throw new Error("TokenUpdate payload must contain tokenId and operations");
  }

  const { tokenId, operations } = tx.payload;

  if (tokenId.length < PLT_TOKEN_ID_MIN_LENGTH || tokenId.length > PLT_TOKEN_ID_MAX_LENGTH) {
    throw new Error(
      `Token id length ${tokenId.length} is outside the device range of ${PLT_TOKEN_ID_MIN_LENGTH}..${PLT_TOKEN_ID_MAX_LENGTH} bytes`,
    );
  }

  if (operations.length === 0) {
    throw new Error("TokenUpdate operations blob must not be empty");
  }

  if (operations.length > PLT_CBOR_MAX_SIZE) {
    throw new Error(
      `TokenUpdate operations blob is ${operations.length} bytes, exceeding the device limit of ${PLT_CBOR_MAX_SIZE} bytes`,
    );
  }

  // The blob arrives as opaque bytes, so a caller can bypass
  // encodePltTransferOperations and hand over a multi-operation array. The
  // device answers that with 0x6B10 after the user has already been prompted,
  // so check the outer array header here: 0x81 is "array of exactly one".
  if (operations.readUInt8(0) !== CBOR_SINGLE_ELEMENT_ARRAY) {
    throw new Error(
      `TokenUpdate operations must be a single-element CBOR array (0x${CBOR_SINGLE_ELEMENT_ARRAY.toString(16)}), got 0x${operations.readUInt8(0).toString(16)}`,
    );
  }

  const serializedPayload = Buffer.concat([
    encodeWord8(tokenId.length),
    tokenId,
    encodeWord32(operations.length),
    operations,
  ]);

  const serializedHeader = serializeTransactionHeader(tx, serializedPayload);
  const serializedType = Buffer.from([tx.type]);

  return Buffer.concat([serializedHeader, serializedType, serializedPayload]);
};

/**
 * Deserializes a TokenUpdate transaction.
 *
 * Provided for round-trip testing and for symmetry with the other transaction
 * types. The send flow never needs it: PLT history arrives from the wallet proxy
 * as JSON, so nothing in production decodes a PLT payload. The CBOR operations
 * blob is returned as raw bytes rather than parsed.
 *
 * @param buffer Serialized TokenUpdate transaction
 * @returns The deserialized transaction, with `operations` still CBOR-encoded
 */
export const deserializeTokenUpdate = (buffer: Buffer): TokenUpdateTransaction => {
  const TYPE_OFFSET = 60;
  const MIN_LENGTH = TYPE_OFFSET + 1 + 1 + PLT_TOKEN_ID_MIN_LENGTH + 4 + 1;

  if (buffer.length < MIN_LENGTH) {
    throw new Error(
      `TokenUpdate buffer too short: expected at least ${MIN_LENGTH} bytes, got ${buffer.length}`,
    );
  }

  const sender = AccountAddress.fromBuffer(buffer.subarray(0, 32));
  const nonce = decodeWord64(buffer, 32);
  const energyAmount = decodeWord64(buffer, 40);
  const expiry = decodeWord64(buffer, 52);

  const type = buffer.readUInt8(TYPE_OFFSET);
  if (type !== TransactionType.TokenUpdate) {
    throw new Error(`Expected TokenUpdate type ${TransactionType.TokenUpdate}, got ${type}`);
  }

  const tokenIdLength = buffer.readUInt8(TYPE_OFFSET + 1);
  if (tokenIdLength < PLT_TOKEN_ID_MIN_LENGTH || tokenIdLength > PLT_TOKEN_ID_MAX_LENGTH) {
    throw new Error(
      `Token id length ${tokenIdLength} is outside the device range of ${PLT_TOKEN_ID_MIN_LENGTH}..${PLT_TOKEN_ID_MAX_LENGTH} bytes`,
    );
  }

  const tokenIdOffset = TYPE_OFFSET + 2;
  const cborLengthOffset = tokenIdOffset + tokenIdLength;
  if (buffer.length < cborLengthOffset + 4) {
    throw new Error("TokenUpdate buffer truncated before the CBOR length field");
  }

  const tokenId = Buffer.from(buffer.subarray(tokenIdOffset, cborLengthOffset));
  const cborLength = decodeWord32(buffer, cborLengthOffset);
  const operations = Buffer.from(buffer.subarray(cborLengthOffset + 4));

  if (cborLength < 1 || cborLength > PLT_CBOR_MAX_SIZE) {
    throw new Error(
      `Declared CBOR length ${cborLength} is outside the device range of 1..${PLT_CBOR_MAX_SIZE} bytes`,
    );
  }

  if (operations.length !== cborLength) {
    throw new Error(
      `Declared CBOR length ${cborLength} does not match the ${operations.length} remaining bytes`,
    );
  }

  // payloadSize covers the kind byte and everything after it, the same rule
  // serializeTransactionHeader applies and deserializeTransfer checks.
  const payloadSize = decodeWord32(buffer, 48);
  const expectedPayloadSize = 1 + 1 + tokenIdLength + 4 + cborLength;
  if (payloadSize !== expectedPayloadSize) {
    throw new Error(
      `Invalid payload size for TokenUpdate: expected ${expectedPayloadSize}, got ${payloadSize}`,
    );
  }

  return {
    header: { sender, nonce, expiry, energyAmount },
    type: TransactionType.TokenUpdate,
    payload: { tokenId, operations },
  };
};

/**
 * Serializes credential deployment values from CredentialDeploymentTransaction.
 *
 * Extracts and serializes the core credential data from the device format where:
 * - all hex fields (credId, verifyKey, etc.) are strings
 * - numeric fields are primitive types (number/bigint)
 *
 * Note: This function does NOT serialize proofs. Proofs are serialized separately
 * in serializeCredentialDeployment() via serializeIdOwnershipProofs().
 *
 * @private
 * @param payload The credential deployment transaction in device format
 * @returns Serialized credential data ready for chunking
 */
export function serializeCredentialDeploymentValues(
  payload: CredentialDeploymentTransaction,
): Buffer {
  const revealedAttributes = Object.entries(payload.policy.revealedAttributes);

  // Sort attributes by tag (numeric index) and serialize each as [tag:1][length:1][value:N]
  const serializedAttributes = revealedAttributes
    .map(([tagName, value]) => ({ tag: Number.parseInt(tagName, 10), value }))
    .sort((a, b) => a.tag - b.tag)
    .flatMap(({ tag, value }) => {
      const serializedValue = Buffer.from(value, "utf-8");
      return [
        Buffer.concat([encodeWord8(tag), encodeWord8(serializedValue.length)]),
        serializedValue,
      ];
    });

  return Buffer.concat([
    serializeMap(
      payload.credentialPublicKeys.keys,
      encodeWord8,
      encodeWord8FromString,
      serializeVerifyKey,
    ),
    encodeWord8(payload.credentialPublicKeys.threshold),
    Buffer.from(payload.credId, "hex"),
    encodeWord32(payload.ipIdentity),
    encodeWord8(payload.revocationThreshold),
    serializeMap(
      payload.arData,
      encodeWord16,
      key => encodeWord32(Number.parseInt(key, 10)),
      arData => Buffer.from(arData.encIdCredPubShare, "hex"),
    ),
    serializeYearMonth(payload.policy.validTo),
    serializeYearMonth(payload.policy.createdAt),
    encodeWord16(revealedAttributes.length),
    ...serializedAttributes,
  ]);
}

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
 * - TokenUpdate (0x1B): [token_id_length:1][token_id:N][cbor_length:4][cbor:M]
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

  if (
    type !== TransactionType.Transfer &&
    type !== TransactionType.TransferWithMemo &&
    type !== TransactionType.TokenUpdate
  ) {
    throw new Error(
      `Unsupported transaction type: ${type} (0x${type.toString(16)}). Expected Transfer (${TransactionType.Transfer}), TransferWithMemo (${TransactionType.TransferWithMemo}) or TokenUpdate (${TransactionType.TokenUpdate})`,
    );
  }

  return type;
}

/**
 * Deserializes a CCD transaction buffer by automatically detecting its type.
 *
 * TokenUpdate is detected but rejected: PLT transactions deserialize through
 * {@link deserializeTokenUpdate}.
 *
 * @param buffer - Serialized transaction buffer
 * @returns The deserialized transaction
 * @throws Error if the buffer is invalid, carries a TokenUpdate, or has an unsupported type
 */
export function deserializeTransaction(buffer: Buffer): Transaction {
  const type = getTransactionType(buffer);

  switch (type) {
    case TransactionType.Transfer:
      return deserializeTransfer(buffer);
    case TransactionType.TransferWithMemo:
      return deserializeTransferWithMemo(buffer);
    case TransactionType.TokenUpdate:
      throw new Error(
        "TokenUpdate transactions are not handled by deserializeTransaction; use deserializeTokenUpdate",
      );
    default:
      // This should never happen since getTransactionType validates the type
      /* istanbul ignore next */
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
export function serializeTransaction(transaction: AnyTransaction): Buffer {
  if (isTokenUpdateTransaction(transaction)) {
    return serializeTokenUpdate(transaction);
  }

  switch (transaction.type) {
    case TransactionType.Transfer:
      return serializeTransfer(transaction);
    case TransactionType.TransferWithMemo:
      return serializeTransferWithMemo(transaction);
    // The narrowed discriminator makes this unreachable for a well-typed caller,
    // but it still catches a malformed object from JS or a cast.
    default:
      throw new Error(
        `Unsupported transaction type for serialization: ${(transaction as AnyTransaction).type}`,
      );
  }
}
