import * as protobuf from "protobufjs";
import type { Root } from "protobufjs";
// Import generated protobuf JSON bindings
// We use JSON instead of the TypeScript static module because it's too large (15k+ lines)
import transactionProtoJson from "./types/transaction-proto.json";

// Initialize protobuf root from JSON bindings
const root: Root = protobuf.Root.fromJSON(transactionProtoJson);

function getProtobufRoot(): Root {
  return root;
}

const RESERVED_WORDS = {
  bool: "bool_",
  enum: "enum_",
  constructor: "constructor_",
};

function replaceReservedWords(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(replaceReservedWords);

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    transformed[RESERVED_WORDS[key as keyof typeof RESERVED_WORDS] || key] =
      replaceReservedWords(value);
  }
  return transformed;
}

/**
 * Encode DAML transaction to protobuf bytes
 */
export function encodeDamlTransaction(data: {
  version: string;
  roots: string[];
  nodesCount: number;
  nodeSeeds: Array<{ seed: Uint8Array; nodeId?: number }>;
}): Uint8Array {
  const protobufRoot = getProtobufRoot();
  const DeviceDamlTransaction = protobufRoot.lookupType(
    "com.daml.ledger.api.v2.interactive.DeviceDamlTransaction",
  );
  return DeviceDamlTransaction.encode(data).finish();
}

/**
 * Encode input contract to protobuf bytes
 */
export function encodeInputContract(contract: any): Uint8Array {
  const { eventBlob, ...contractWithoutBlob } = contract;
  const protobufRoot = getProtobufRoot();
  const InputContract = protobufRoot.lookupType(
    "com.daml.ledger.api.v2.interactive.DeviceMetadata.InputContract",
  );
  const contractPb = InputContract.fromObject(replaceReservedWords(contractWithoutBlob));
  return InputContract.encode(contractPb).finish();
}

/**
 * Encode metadata to protobuf bytes
 */
export function encodeMetadata(data: {
  submitterInfo: {
    actAs: string[];
    commandId: string;
  };
  synchronizerId: string;
  mediatorGroup?: number;
  transactionUuid: string;
  submissionTime: number;
  inputContractsCount: number;
  minLedgerEffectiveTime?: number;
  maxLedgerEffectiveTime?: number;
}): Uint8Array {
  const protobufRoot = getProtobufRoot();
  const DeviceMetadata = protobufRoot.lookupType(
    "com.daml.ledger.api.v2.interactive.DeviceMetadata",
  );
  return DeviceMetadata.encode(data).finish();
}

/**
 * Encode transaction node to protobuf bytes
 */
export function encodeNode(node: any): Uint8Array {
  const protobufRoot = getProtobufRoot();
  const Node = protobufRoot.lookupType(
    "com.daml.ledger.api.v2.interactive.DeviceDamlTransaction.Node",
  );
  const nodePb = Node.fromObject(replaceReservedWords(node));
  return Node.encode(nodePb).finish();
}
