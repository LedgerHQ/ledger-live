import type {
  CantonInputContract,
  CantonTransactionNode,
  CantonTransactionMetadata,
  CantonTransactionData,
} from "./types";
import { ProtobufTypes } from "./protobufRoot";

const DeviceDamlTransactionType = ProtobufTypes.DeviceDamlTransaction;
const InputContractType = ProtobufTypes.InputContract;
const DeviceMetadataType = ProtobufTypes.DeviceMetadata;
const NodeType = ProtobufTypes.Node;

const RESERVED_WORDS: Record<string, string> = {
  bool: "bool_",
  enum: "enum_",
  constructor: "constructor_",
};

function replaceReservedWords(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(replaceReservedWords);

  const transformed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const transformedKey = RESERVED_WORDS[key] ?? key;
    transformed[transformedKey] = replaceReservedWords(value);
  }
  return transformed;
}

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

function replaceReservedWordsInObject<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result = replaceReservedWords(obj);
  if (!isRecord(result)) {
    throw new Error("Expected object result from replaceReservedWords");
  }
  return result;
}

/**
 * Encode DAML transaction to protobuf bytes
 */
export function encodeDamlTransaction(data: CantonTransactionData): Uint8Array {
  const transformed = {
    version: data.version,
    roots: data.roots,
    nodesCount: data.nodes?.length || 0,
    nodeSeeds: (data.nodeSeeds || []).map(seed => ({
      seed: Buffer.from(seed.seed, "base64"),
      ...(seed.nodeId && seed.nodeId !== 0 && { nodeId: seed.nodeId }),
    })),
  };
  return DeviceDamlTransactionType.encode(transformed).finish();
}

/**
 * Encode input contract to protobuf bytes
 */
export function encodeInputContract(contract: CantonInputContract): Uint8Array {
  const { eventBlob, ...contractWithoutBlob } = contract;
  const contractPb = InputContractType.fromObject(
    replaceReservedWordsInObject(contractWithoutBlob),
  );
  return InputContractType.encode(contractPb).finish();
}

/**
 * Encode metadata to protobuf bytes
 */
export function encodeMetadata(
  data: CantonTransactionMetadata,
  inputContractsCount: number,
): Uint8Array {
  const transformed = {
    submitterInfo: data.submitterInfo,
    synchronizerId: data.synchronizerId,
    ...(data.mediatorGroup !== undefined && { mediatorGroup: data.mediatorGroup }),
    transactionUuid: data.transactionUuid,
    preparationTime: Number.parseInt(data.preparationTime, 10),
    inputContractsCount,
    ...(data.minLedgerEffectiveTime !== undefined && {
      minLedgerEffectiveTime: Number.parseInt(data.minLedgerEffectiveTime, 10),
    }),
    ...(data.maxLedgerEffectiveTime !== undefined && {
      maxLedgerEffectiveTime: Number.parseInt(data.maxLedgerEffectiveTime, 10),
    }),
  };
  return DeviceMetadataType.encode(transformed).finish();
}

/**
 * Encode transaction node to protobuf bytes
 */
export function encodeNode(node: CantonTransactionNode): Uint8Array {
  const nodePb = NodeType.fromObject(replaceReservedWordsInObject(node));
  return NodeType.encode(nodePb).finish();
}
