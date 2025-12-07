/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Canton Testing Utilities for Ed25519 Key Generation
 *
 * Provides utilities to generate proper Ed25519 keypairs for testing Canton
 * onboarding without requiring physical Ledger devices.
 * The mock signer implements canonical hash algorithm used by the Canton app.
 */

import * as transactionProto from "@ledgerhq/hw-app-canton/lib/types/transaction-proto.json";
import crypto from "crypto";
import * as protobuf from "protobufjs";
import { CantonPreparedTransaction, CantonUntypedVersionedMessage } from "../types/signer";

const root: { [key: string]: any } = protobuf.Root.fromJSON(transactionProto) || {};

// Constants from app-canton
const PREPARED_TRANSACTION_HASH_PURPOSE = Buffer.from([0x00, 0x00, 0x00, 0x30]);
const HASHING_SCHEME_VERSION = 0x02;
const NODE_ENCODING_VERSION = 0x01;
const PURPOSE_PUBLIC_KEY_FINGERPRINT = 12;
const PURPOSE_TOPOLOGY_TRANSACTION_SIGNATURE = 11;
const PURPOSE_MULTI_TOPOLOGY_TRANSACTION_SIGNATURE = 55;
const MULTIHASH_SHA256_PREFIX = Buffer.from([0x12, 0x20]);

export interface CantonTestKeyPair {
  publicKeyHex: string; // Ready for Canton Gateway API
  privateKeyHex: string; // ASN.1 DER encoded private key in hex format
  privateKeyPem: string; // PEM format for signing operations
  fingerprint: string; // Canton public key fingerprint (multihash: 1220 + SHA256(publicKey))
  sign: (hashHex: string) => string; // Sign transaction hash
}

/**
 * Generate fresh Ed25519 keypair
 */
export function generateMockKeyPair(): CantonTestKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyBuffer = publicKey.export({ type: "spki", format: "der" });
  const rawPublicKey = publicKeyBuffer.slice(-32);
  const publicKeyHex = rawPublicKey.toString("hex");

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
  const privateKeyDer = privateKey.export({ type: "pkcs8", format: "der" });
  const privateKeyHex = privateKeyDer.toString("hex");

  // Generate fingerprint: Canton computes SHA256(purpose_bytes + public_key_bytes)
  const purposeBytes = Buffer.allocUnsafe(4);
  purposeBytes.writeInt32BE(PURPOSE_PUBLIC_KEY_FINGERPRINT, 0);

  const hash = crypto.createHash("sha256");
  hash.update(purposeBytes);
  hash.update(rawPublicKey);
  const hashedContent = hash.digest();

  // Multihash encoding: 0x12 (SHA256) + 0x20 (32 bytes) + hash
  const fingerprintBuffer = Buffer.concat([MULTIHASH_SHA256_PREFIX, hashedContent]);
  const fingerprint = fingerprintBuffer.toString("hex");

  return {
    publicKeyHex, // 64-char hex string (no 0x prefix)
    privateKeyHex, // ASN.1 DER encoded private key in hex format
    privateKeyPem, // PEM format string
    fingerprint, // Canton format: multihash prefix + SHA256(public key)

    /**
     * Sign a transaction hash using proper Ed25519 signature
     */
    sign: (hashHex: string): string => {
      const hashBuffer = Buffer.from(hashHex, "hex");
      const privateKeyObj = crypto.createPrivateKey({
        key: privateKeyPem,
        format: "pem",
        type: "pkcs8",
      });
      return crypto.sign(null, hashBuffer, privateKeyObj).toString("hex");
    },
  };
}

/**
 * Verify Ed25519 signature against public key and message hash
 */
export function verifySignature(
  publicKeyHex: string,
  signatureHex: string,
  messageHashHex: string,
): { isValid: boolean; error?: string; details: Record<string, string | number> } {
  try {
    // Clean inputs - remove 0x prefixes if present
    const cleanPublicKey = publicKeyHex.startsWith("0x") ? publicKeyHex.slice(2) : publicKeyHex;
    const cleanSignature = signatureHex.startsWith("0x") ? signatureHex.slice(2) : signatureHex;
    const cleanMessageHash = messageHashHex.startsWith("0x")
      ? messageHashHex.slice(2)
      : messageHashHex;

    const details: Record<string, string | number> = {
      publicKeyLength: cleanPublicKey.length,
      signatureLength: cleanSignature.length,
      messageHashLength: cleanMessageHash.length,
    };

    // Validate input lengths
    if (cleanPublicKey.length !== 64) {
      return {
        isValid: false,
        error: `Invalid public key length: expected 64 hex chars (32 bytes), got ${cleanPublicKey.length}`,
        details,
      };
    }

    // Handle 65-byte signatures (remove recovery ID)
    let processedSignature = cleanSignature;
    if (cleanSignature.length === 130) {
      processedSignature = cleanSignature.slice(2, -2);
    } else if (cleanSignature.length !== 128) {
      return {
        isValid: false,
        error: `Invalid signature length: expected 128 or 130 hex chars, got ${cleanSignature.length}`,
        details,
      };
    }

    // Convert hex to buffers
    const publicKeyBuffer = Buffer.from(cleanPublicKey, "hex");
    const signatureBuffer = Buffer.from(processedSignature, "hex");
    const messageBuffer = Buffer.from(cleanMessageHash, "hex");

    // Create public key object for verification
    // Ed25519 public keys need to be wrapped in SPKI format for Node.js crypto
    const spkiHeader = Buffer.from([
      0x30,
      0x2a, // SEQUENCE, length 42
      0x30,
      0x05, // SEQUENCE, length 5
      0x06,
      0x03,
      0x2b,
      0x65,
      0x70, // OID for Ed25519
      0x03,
      0x21,
      0x00, // BIT STRING, length 33, no unused bits
    ]);
    const spkiPublicKey = Buffer.concat([spkiHeader, publicKeyBuffer]);

    const publicKeyObj = crypto.createPublicKey({
      key: spkiPublicKey,
      format: "der",
      type: "spki",
    });

    // Verify signature
    const isValid = crypto.verify(null, messageBuffer, publicKeyObj, signatureBuffer);

    return {
      isValid,
      details: { ...details, processedSignatureLength: processedSignature.length },
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) },
    };
  }
}

export function createMockSigner(keyPair: CantonTestKeyPair) {
  return {
    getAddress: async (_derivationPath: string) => ({
      address: `canton_test_${keyPair.fingerprint.slice(-8)}`,
      publicKey: keyPair.publicKeyHex,
    }),

    signTransaction: async (
      _derivationPath: string,
      data: CantonPreparedTransaction | CantonUntypedVersionedMessage | string,
    ) => {
      let hashToSign: string;

      if (typeof data === "object" && "transactions" in data) {
        // CantonUntypedVersionedMessage - process multiple topology transactions
        const hashes = data.transactions.map(tx => {
          const txBytes = typeof tx === "string" ? Buffer.from(tx, "hex") : Buffer.from(tx);
          return computeCantonHash(PURPOSE_TOPOLOGY_TRANSACTION_SIGNATURE, txBytes);
        });

        // Sort hashes lexicographically in hex format
        const sortedHashes = hashes.sort((a, b) =>
          a.toString("hex").localeCompare(b.toString("hex")),
        );

        // Concatenate with length prefixes: 4-byte count + for each hash: 4-byte length + 34-byte hash
        const concatBuffer = Buffer.alloc(4 + sortedHashes.length * (4 + 34));
        let offset = 0;

        // Write count of hashes (4 bytes big-endian)
        concatBuffer.writeUInt32BE(sortedHashes.length, offset);
        offset += 4;

        // Write each hash with length prefix
        for (const hash of sortedHashes) {
          concatBuffer.writeUInt32BE(34, offset); // Length is always 34 bytes
          offset += 4;
          hash.copy(concatBuffer, offset);
          offset += 34;
        }

        // Compute final multi-hash
        const finalHash = computeCantonHash(
          PURPOSE_MULTI_TOPOLOGY_TRANSACTION_SIGNATURE,
          concatBuffer,
        );
        hashToSign = finalHash.toString("hex");
      } else if (typeof data === "object") {
        const canonicalHash = computeCanonicalHash(data);
        hashToSign = canonicalHash.toString("hex");
      } else {
        hashToSign = data;
      }

      const cleanHash = hashToSign.startsWith("0x") ? hashToSign.slice(2) : hashToSign;
      const signature = keyPair.sign(cleanHash);
      return { signature };
    },
  };
}

/**
 * Compute Canton hash with purpose and multihash encoding
 */
function computeCantonHash(purpose: number, data: Buffer): Buffer {
  const purposeBytes = Buffer.allocUnsafe(4);
  purposeBytes.writeUInt32BE(purpose, 0);

  const hash = crypto.createHash("sha256");
  hash.update(purposeBytes);
  hash.update(data);
  const hashedContent = hash.digest();

  // Multihash encoding: 0x12 (SHA256) + 0x20 (32 bytes) + hash
  return Buffer.concat([MULTIHASH_SHA256_PREFIX, hashedContent]);
}

/**
 * Compute canonical hash for CantonPreparedTransaction
 * Implements canonical_hash.c
 */
function computeCanonicalHash(data: CantonPreparedTransaction): Buffer {
  // Step 1: Parse DAML transaction
  const DeviceDamlTransaction = root.lookupType(
    "com.daml.ledger.api.v2.interactive.DeviceDamlTransaction",
  );
  const damlTx = DeviceDamlTransaction.decode(data.damlTransaction);

  // Step 2: Hash transaction (hash_transaction)
  const txHash = hashTransaction(damlTx);

  // Step 3: Hash nodes (hash_node)
  const nodesHash = hashNodes(damlTx, data.nodes);

  // Step 4: Combine transaction and nodes hash
  const combinedTxHash = crypto.createHash("sha256");
  combinedTxHash.update(txHash);
  combinedTxHash.update(nodesHash);
  const finalTxHash = combinedTxHash.digest();

  // Step 5: Hash metadata (hash_metadata)
  const DeviceMetadata = root.lookupType("com.daml.ledger.api.v2.interactive.DeviceMetadata");
  const metadata = DeviceMetadata.decode(data.metadata);
  const metadataHash = hashMetadata(metadata, data.inputContracts);

  // Step 6: Finalize hash (finalize_hash)
  return finalizeHash(finalTxHash, metadataHash);
}

/**
 * Hash DAML transaction
 * Implements hash_transaction from canonical_hash.c
 */
function hashTransaction(damlTx: any): Buffer {
  const hash = crypto.createHash("sha256");

  // Add purpose (PREPARED_TRANSACTION_HASH_PURPOSE = {0x00, 0x00, 0x00, 0x30})
  hash.update(PREPARED_TRANSACTION_HASH_PURPOSE);

  // Encode version string
  encodeString(hash, damlTx.version || "");

  // Encode roots count
  encodeInt32(hash, damlTx.rootsCount || 0);

  return hash.digest();
}

/**
 * Hash nodes
 * Implements hash_node from canonical_hash.c
 */
function hashNodes(damlTx: any, nodes: Uint8Array[]): Buffer {
  const hash = crypto.createHash("sha256");

  // Process each node
  for (const nodeBytes of nodes) {
    const Node = root.lookupType("com.daml.ledger.api.v2.interactive.DeviceDamlTransaction.Node");
    const node = Node.decode(nodeBytes);

    // Check if this is a root node
    const isRootNode = damlTx.roots?.includes(node.nodeId);

    // Hash the node (encode_node_id_hash)
    const nodeHash = hashNodeId(node, isRootNode, damlTx.nodeSeeds || []);

    if (isRootNode) {
      // For root nodes, add directly to the hash
      hash.update(nodeHash);
    }
    // Non-root nodes are ignored in this implementation
  }

  return hash.digest();
}

/**
 * Hash a single node
 * Implements encode_node_id_hash from canonical_hash.c
 */
function hashNodeId(node: any, isRootNode: boolean, nodeSeeds: any[]): Buffer {
  // Create separate hash writer for the node
  const nodeHash = crypto.createHash("sha256");

  // Encode the node based on its type (encode_node)
  if (node.v1) {
    if (node.v1.create) {
      encodeCreateNode(nodeHash, node.v1.create, node.nodeId, nodeSeeds);
    } else if (node.v1.exercise) {
      encodeExerciseNode(nodeHash, node.v1.exercise, node.nodeId, nodeSeeds);
    } else if (node.v1.fetch) {
      encodeFetchNode(nodeHash, node.v1.fetch);
    } else if (node.v1.rollback) {
      encodeRollbackNode(nodeHash, node.v1.rollback);
    }
  }

  return nodeHash.digest();
}

/**
 * Encode create node
 * Implements encode_create from canonical_hash.c
 */
function encodeCreateNode(hash: crypto.Hash, create: any, nodeId: string, nodeSeeds: any[]): void {
  // NODE_ENCODING_VERSION = 0x01
  hash.update(Buffer.from([NODE_ENCODING_VERSION]));

  // lf_version string
  encodeString(hash, create.lfVersion || "");

  // 0x00 byte
  hash.update(Buffer.from([0x00]));

  // Optional seed (find_seed)
  const seed = findNodeSeed(nodeId, nodeSeeds);
  if (seed) {
    // Seed is present - encode as hash
    hash.update(seed);
  } else {
    // No seed - encode as optional false
    hash.update(Buffer.from([0x00]));
  }

  // contract_id as hex string
  encodeHexString(hash, create.contractId || "");

  // package_name string
  encodeString(hash, create.packageName || "");

  // template_id identifier
  if (create.templateId) {
    encodeIdentifier(hash, create.templateId);
  }

  // argument value (this needs proper DAML value encoding)
  if (create.argument) {
    encodeValue(hash, create.argument);
  }

  // signatories repeated strings
  if (create.signatories) {
    encodeRepeatedStrings(hash, create.signatories);
  }

  // stakeholders repeated strings
  if (create.stakeholders) {
    encodeRepeatedStrings(hash, create.stakeholders);
  }
}

/**
 * Encode exercise node
 * Implements encode_exercise from canonical_hash.c
 */
function encodeExerciseNode(
  hash: crypto.Hash,
  exercise: any,
  nodeId: string,
  nodeSeeds: any[],
): void {
  // NODE_ENCODING_VERSION = 0x01
  hash.update(Buffer.from([NODE_ENCODING_VERSION]));

  // lf_version string
  encodeString(hash, exercise.lfVersion || "");

  // 0x01 byte
  hash.update(Buffer.from([0x01]));

  // Seed is always present for exercise nodes
  const seed = findNodeSeed(nodeId, nodeSeeds);
  if (seed) {
    encodeHash(hash, seed);
  } else {
    // This should not happen, but handle gracefully
    hash.update(Buffer.alloc(32, 0));
  }

  // contract_id as hex string
  encodeHexString(hash, exercise.contractId || "");

  // package_name string
  encodeString(hash, exercise.packageName || "");

  // template_id identifier (required for exercise nodes)
  if (exercise.templateId) {
    encodeIdentifier(hash, exercise.templateId);
  }

  // choice string
  encodeString(hash, exercise.choice || "");

  // argument value
  if (exercise.argument) {
    encodeValue(hash, exercise.argument);
  }

  // acting_parties repeated strings
  if (exercise.actingParties) {
    encodeRepeatedStrings(hash, exercise.actingParties);
  }

  // children repeated strings
  if (exercise.children) {
    encodeRepeatedStrings(hash, exercise.children);
  }

  // exercise_result optional value
  if (exercise.exerciseResult) {
    // Optional present
    hash.update(Buffer.from([0x01]));
    encodeValue(hash, exercise.exerciseResult);
  } else {
    // Optional not present
    hash.update(Buffer.from([0x00]));
  }
}

/**
 * Encode fetch node
 * Implements encode_fetch from canonical_hash.c
 */
function encodeFetchNode(hash: crypto.Hash, fetch: any): void {
  // NODE_ENCODING_VERSION = 0x01
  hash.update(Buffer.from([NODE_ENCODING_VERSION]));

  // lf_version string
  encodeString(hash, fetch.lfVersion || "");

  // 0x02 byte
  hash.update(Buffer.from([0x02]));

  // contract_id as hex string
  encodeHexString(hash, fetch.contractId || "");

  // package_name string
  encodeString(hash, fetch.packageName || "");

  // template_id identifier
  if (fetch.templateId) {
    encodeIdentifier(hash, fetch.templateId);
  }
}

/**
 * Encode rollback node
 * Implements encode_rollback from canonical_hash.c
 */
function encodeRollbackNode(hash: crypto.Hash, rollback: any): void {
  // NODE_ENCODING_VERSION = 0x01
  hash.update(Buffer.from([NODE_ENCODING_VERSION]));

  // lf_version string
  encodeString(hash, rollback.lfVersion || "");

  // 0x03 byte
  hash.update(Buffer.from([0x03]));

  // children repeated strings
  if (rollback.children) {
    encodeRepeatedStrings(hash, rollback.children);
  }
}

/**
 * Find node seed for a given node ID
 */
function findNodeSeed(nodeId: string, nodeSeeds: any[]): Buffer | null {
  const nodeIdNum = Number.parseInt(nodeId, 10);
  for (const seed of nodeSeeds) {
    if (seed.nodeId === nodeIdNum) {
      return Buffer.from(seed.seed);
    }
  }
  return null;
}

/**
 * Encode identifier
 */
function encodeIdentifier(hash: crypto.Hash, identifier: any): void {
  if (identifier.packageId) {
    encodeString(hash, identifier.packageId);
  }

  if (identifier.moduleName) {
    splitDotAndEncode(hash, identifier.moduleName);
  }

  if (identifier.entityName) {
    splitDotAndEncode(hash, identifier.entityName);
  }
}

/**
 * Split dot-separated string and encode
 */
function splitDotAndEncode(hash: crypto.Hash, dotStr: string): void {
  const parts = dotStr.split(".");
  encodeInt32(hash, parts.length);

  for (const part of parts) {
    encodeInt32(hash, part.length);
    hash.update(Buffer.from(part, "utf8"));
  }
}

/**
 * Hash metadata
 * Implements hash_metadata from canonical_hash.c
 */
function hashMetadata(metadata: any, inputContracts: Uint8Array[]): Buffer {
  const hash = crypto.createHash("sha256");

  // Add purpose (PREPARED_TRANSACTION_HASH_PURPOSE = {0x00, 0x00, 0x00, 0x30})
  hash.update(PREPARED_TRANSACTION_HASH_PURPOSE);

  // Encode metadata (encode_metadata)
  // Version marker (0x01)
  hash.update(Buffer.from([0x01]));

  // Encode submitter info
  if (metadata.submitterInfo) {
    // act_as repeated strings
    if (metadata.submitterInfo.actAs) {
      encodeRepeatedStrings(hash, metadata.submitterInfo.actAs);
    } else {
      encodeInt32(hash, 0);
    }
    // command_id string
    encodeString(hash, metadata.submitterInfo.commandId || "");
  } else {
    // No submitter info - encode empty
    encodeInt32(hash, 0);
    encodeString(hash, "");
  }

  // Encode other metadata fields
  encodeString(hash, metadata.transactionUuid || "");
  encodeInt32(hash, metadata.mediatorGroup || 0);
  encodeString(hash, metadata.synchronizerId || "");

  // Encode optional time fields
  if (metadata.minLedgerEffectiveTime === undefined) {
    // Optional not present
    hash.update(Buffer.from([0x00]));
  } else {
    // Optional present
    hash.update(Buffer.from([0x01]));
    encodeInt64(hash, metadata.minLedgerEffectiveTime);
  }

  if (metadata.maxLedgerEffectiveTime === undefined) {
    // Optional not present
    hash.update(Buffer.from([0x00]));
  } else {
    // Optional present
    hash.update(Buffer.from([0x01]));
    encodeInt64(hash, metadata.maxLedgerEffectiveTime);
  }

  // Encode submission time and input contracts count
  encodeInt64(hash, metadata.submissionTime || 0);
  encodeInt32(hash, metadata.inputContractsCount || 0);

  // Hash input contracts
  for (const contract of inputContracts) {
    const contractHash = hashInputContract(contract);
    encodeHash(hash, contractHash);
  }

  return hash.digest();
}

/**
 * Hash input contract
 * Implements hash_input_contract from canonical_hash.c
 */
function hashInputContract(contract: Uint8Array): Buffer {
  const InputContract = root.lookupType(
    "com.daml.ledger.api.v2.interactive.DeviceMetadata.InputContract",
  );
  const contractData = InputContract.decode(contract);

  const hash = crypto.createHash("sha256");

  // Encode created_at (int64)
  encodeInt64(hash, contractData.createdAt || 0);

  // Hash the contract create node in separate buffer
  const nodeHash = crypto.createHash("sha256");

  // Encode the create node
  if (contractData.v1) {
    // Simplified encode_create approach
    nodeHash.update(Buffer.from([NODE_ENCODING_VERSION])); // NODE_ENCODING_VERSION = 0x01
    encodeString(nodeHash, contractData.v1.lfVersion || "");
    nodeHash.update(Buffer.from([0x00])); // 0x00 byte
    nodeHash.update(Buffer.from([0x00])); // No seed for input contracts
    encodeHexString(nodeHash, contractData.v1.contractId || "");
    encodeString(nodeHash, contractData.v1.packageName || "");

    if (contractData.v1.templateId) {
      encodeIdentifier(nodeHash, contractData.v1.templateId);
    }

    if (contractData.v1.argument) {
      encodeValue(nodeHash, contractData.v1.argument);
    }

    if (contractData.v1.signatories) {
      encodeRepeatedStrings(nodeHash, contractData.v1.signatories);
    }

    if (contractData.v1.stakeholders) {
      encodeRepeatedStrings(nodeHash, contractData.v1.stakeholders);
    }
  }

  const contractNodeHash = nodeHash.digest();
  encodeHash(hash, contractNodeHash);

  return hash.digest();
}

/**
 * Finalize hash
 * Implements finalize_hash from canonical_hash.c
 */
function finalizeHash(txHash: Buffer, metadataHash: Buffer): Buffer {
  const hash = crypto.createHash("sha256");

  // Add purpose (PREPARED_TRANSACTION_HASH_PURPOSE = {0x00, 0x00, 0x00, 0x30})
  hash.update(PREPARED_TRANSACTION_HASH_PURPOSE);

  // Add hashing scheme version (HASHING_SCHEME_VERSION = 0x02)
  hash.update(Buffer.from([HASHING_SCHEME_VERSION]));

  // Add transaction hash (32 bytes)
  hash.update(txHash);

  // Add metadata hash (32 bytes)
  hash.update(metadataHash);

  return hash.digest();
}

// Helper functions for canonical encoding
function encodeString(hash: crypto.Hash, value: string): void {
  const bytes = Buffer.from(value, "utf8");
  encodeBytes(hash, bytes);
}

function encodeInt32(hash: crypto.Hash, value: number | null | undefined): void {
  const buffer = Buffer.allocUnsafe(4);
  const safeValue = value ?? 0;
  buffer.writeUInt32BE(safeValue, 0);
  hash.update(buffer);
}

function encodeInt64(hash: crypto.Hash, value: number | null | undefined): void {
  const buffer = Buffer.allocUnsafe(8);
  const safeValue = value ?? 0;
  buffer.writeBigUInt64BE(BigInt(safeValue), 0);
  hash.update(buffer);
}

function encodeBytes(hash: crypto.Hash, bytes: Buffer): void {
  encodeInt32(hash, bytes.length);
  hash.update(bytes);
}

function encodeRepeatedStrings(hash: crypto.Hash, strings: string[]): void {
  encodeInt32(hash, strings.length);
  for (const str of strings) {
    encodeString(hash, str);
  }
}

function encodeHash(hash: crypto.Hash, hashValue: Buffer): void {
  hash.update(hashValue);
}

/**
 * Encode DAML value
 * Implements encode_value from canonical_hash.c
 */
function encodeValue(hash: crypto.Hash, value: any): void {
  if (!value || typeof value !== "object") {
    // Handle primitive values
    if (value === null || value === undefined) {
      // VALUE_UNIT_TAG = 0x00
      hash.update(Buffer.from([0x00]));
    } else if (typeof value === "boolean") {
      // VALUE_BOOL_TAG = 0x01
      hash.update(Buffer.from([0x01]));
      encodeBool(hash, value);
    } else if (typeof value === "number" && Number.isInteger(value)) {
      // VALUE_INT64_TAG = 0x02
      hash.update(Buffer.from([0x02]));
      encodeInt64(hash, value);
    } else if (typeof value === "string") {
      // VALUE_TEXT_TAG = 0x07
      hash.update(Buffer.from([0x07]));
      encodeString(hash, value);
    }
    return;
  }

  // Handle complex values based on their structure
  if (value.unit !== undefined) {
    // VALUE_UNIT_TAG = 0x00
    hash.update(Buffer.from([0x00]));
  } else if (value.bool !== undefined) {
    // VALUE_BOOL_TAG = 0x01
    hash.update(Buffer.from([0x01]));
    encodeBool(hash, value.bool);
  } else if (value.int64 !== undefined) {
    // VALUE_INT64_TAG = 0x02
    hash.update(Buffer.from([0x02]));
    encodeInt64(hash, value.int64);
  } else if (value.numeric !== undefined) {
    // VALUE_NUMERIC_TAG = 0x03
    hash.update(Buffer.from([0x03]));
    encodeString(hash, value.numeric);
  } else if (value.timestamp !== undefined) {
    // VALUE_TIMESTAMP_TAG = 0x04
    hash.update(Buffer.from([0x04]));
    encodeInt64(hash, value.timestamp);
  } else if (value.date !== undefined) {
    // VALUE_DATE_TAG = 0x05
    hash.update(Buffer.from([0x05]));
    encodeInt32(hash, value.date);
  } else if (value.party !== undefined) {
    // VALUE_PARTY_TAG = 0x06
    hash.update(Buffer.from([0x06]));
    encodeString(hash, value.party);
  } else if (value.text !== undefined) {
    // VALUE_TEXT_TAG = 0x07
    hash.update(Buffer.from([0x07]));
    encodeString(hash, value.text);
  } else if (value.contractId !== undefined) {
    // VALUE_CONTRACT_ID_TAG = 0x08
    hash.update(Buffer.from([0x08]));
    encodeHexString(hash, value.contractId);
  } else if (value.optional !== undefined) {
    // VALUE_OPTIONAL_TAG = 0x09
    hash.update(Buffer.from([0x09]));
    if (value.optional.value === undefined) {
      // Optional not present
      hash.update(Buffer.from([0x00]));
    } else {
      // Optional present
      hash.update(Buffer.from([0x01]));
      encodeValue(hash, value.optional.value);
    }
  } else if (value.list !== undefined) {
    // VALUE_LIST_TAG = 0x0A
    hash.update(Buffer.from([0x0a]));
    if (value.list.elements) {
      encodeRepeatedValues(hash, value.list.elements);
    } else {
      encodeInt32(hash, 0);
    }
  } else if (value.textMap !== undefined) {
    // VALUE_TEXT_MAP_TAG = 0x0B
    hash.update(Buffer.from([0x0b]));
    if (value.textMap.entries) {
      encodeRepeatedTextMapEntries(hash, value.textMap.entries);
    } else {
      encodeInt32(hash, 0);
    }
  } else if (value.record !== undefined) {
    // VALUE_RECORD_TAG = 0x0C
    hash.update(Buffer.from([0x0c]));
    if (value.record.recordId) {
      // Optional present
      hash.update(Buffer.from([0x01]));
      encodeIdentifier(hash, value.record.recordId);
    } else {
      // Optional not present
      hash.update(Buffer.from([0x00]));
    }
    if (value.record.fields) {
      encodeRepeatedRecordFields(hash, value.record.fields);
    } else {
      encodeInt32(hash, 0);
    }
  } else if (value.variant !== undefined) {
    // VALUE_VARIANT_TAG = 0x0D
    hash.update(Buffer.from([0x0d]));
    if (value.variant.variantId) {
      // Optional present
      hash.update(Buffer.from([0x01]));
      encodeIdentifier(hash, value.variant.variantId);
    } else {
      // Optional not present
      hash.update(Buffer.from([0x00]));
    }
    encodeString(hash, value.variant.constructor || "");
    if (value.variant.value) {
      encodeValue(hash, value.variant.value);
    }
  } else if (value.enum !== undefined) {
    // VALUE_ENUM_TAG = 0x0E
    hash.update(Buffer.from([0x0e]));
    if (value.enum.enumId) {
      // Optional present
      hash.update(Buffer.from([0x01]));
      encodeIdentifier(hash, value.enum.enumId);
    } else {
      // Optional not present
      hash.update(Buffer.from([0x00]));
    }
    encodeString(hash, value.enum.constructor || "");
  } else if (value.genMap === undefined) {
    // Fallback for unknown value types
    hash.update(Buffer.from([0x00]));
  } else {
    // VALUE_GEN_MAP_TAG = 0x0F
    hash.update(Buffer.from([0x0f]));
    if (value.genMap.entries) {
      encodeRepeatedGenMapEntries(hash, value.genMap.entries);
    } else {
      encodeInt32(hash, 0);
    }
  }
}

/**
 * Encode boolean value
 */
function encodeBool(hash: crypto.Hash, value: boolean): void {
  hash.update(Buffer.from([value ? 0x01 : 0x00]));
}

/**
 * Encode hex string (for contract IDs)
 */
function encodeHexString(hash: crypto.Hash, hexStr: string): void {
  const cleanHex = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
  const bytes = Buffer.from(cleanHex, "hex");
  encodeBytes(hash, bytes);
}

/**
 * Encode repeated values
 */
function encodeRepeatedValues(hash: crypto.Hash, values: any[]): void {
  encodeInt32(hash, values.length);
  for (const value of values) {
    encodeValue(hash, value);
  }
}

/**
 * Encode repeated text map entries
 */
function encodeRepeatedTextMapEntries(hash: crypto.Hash, entries: any[]): void {
  encodeInt32(hash, entries.length);
  for (const entry of entries) {
    encodeString(hash, entry.key || "");
    encodeValue(hash, entry.value);
  }
}

/**
 * Encode repeated record fields
 */
function encodeRepeatedRecordFields(hash: crypto.Hash, fields: any[]): void {
  encodeInt32(hash, fields.length);
  for (const field of fields) {
    if (field.label) {
      // Optional present
      hash.update(Buffer.from([0x01]));
      encodeString(hash, field.label);
    } else {
      // Optional not present
      hash.update(Buffer.from([0x00]));
    }
    encodeValue(hash, field.value);
  }
}

/**
 * Encode repeated gen map entries
 */
function encodeRepeatedGenMapEntries(hash: crypto.Hash, entries: any[]): void {
  encodeInt32(hash, entries.length);
  for (const entry of entries) {
    encodeValue(hash, entry.key);
    encodeValue(hash, entry.value);
  }
}
