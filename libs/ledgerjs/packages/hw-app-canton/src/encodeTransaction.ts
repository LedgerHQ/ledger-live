import * as protobuf from "protobufjs";
import type { Root } from "protobufjs";
import transactionProtoJson from "./types/transaction-proto.json";
import type {
  CantonInputContract,
  CantonTransactionNode,
  CantonTransactionMetadata,
  CantonTransactionData,
} from "./types";

const root: Root = protobuf.Root.fromJSON(transactionProtoJson);
const DeviceDamlTransactionType = root.lookupType(
  "com.daml.ledger.api.v2.interactive.DeviceDamlTransaction",
);
const InputContractType = root.lookupType(
  "com.daml.ledger.api.v2.interactive.DeviceMetadata.InputContract",
);
const DeviceMetadataType = root.lookupType("com.daml.ledger.api.v2.interactive.DeviceMetadata");
const NodeType = root.lookupType("com.daml.ledger.api.v2.interactive.DeviceDamlTransaction.Node");

const RESERVED_WORDS: Record<string, string> = {
  bool: "bool_",
  enum: "enum_",
  constructor: "constructor_",
};

function replaceReservedWords(obj: any) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(replaceReservedWords);

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const transformedKey = RESERVED_WORDS[key] ?? key;
    transformed[transformedKey] = replaceReservedWords(value);
  }
  return transformed;
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
  const contractPb = InputContractType.fromObject(replaceReservedWords(contractWithoutBlob));
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
    submissionTime: Number.parseInt(data.preparationTime, 10),
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
  const nodePb = NodeType.fromObject(replaceReservedWords(node));
  return NodeType.encode(nodePb).finish();
}
