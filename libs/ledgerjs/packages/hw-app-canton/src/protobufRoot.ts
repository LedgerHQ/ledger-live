import * as protobuf from "protobufjs";
import type { Root, Type } from "protobufjs";
import transactionProtoJson from "./types/transaction-proto.json";

/**
 * Shared protobuf root instance.
 * Created once at module load time to avoid expensive re-parsing of the JSON schema.
 * The protobuf Root.fromJSON operation is expensive as it parses and validates
 * the entire schema, so we memoize it at module level.
 */
let rootInstance: Root | null = null;

export function getProtobufRoot(): Root {
  if (rootInstance === null) {
    rootInstance = protobuf.Root.fromJSON(transactionProtoJson);
  }
  return rootInstance;
}

const typeCache = new Map<string, Type>();

export function lookupProtobufType(typeName: string): Type | null {
  const cached = typeCache.get(typeName);
  if (cached) {
    return cached;
  }

  const root = getProtobufRoot();
  const type = root.lookupType(typeName);

  if (type) {
    typeCache.set(typeName, type);
    return type;
  }

  return null;
}

export const ProtobufTypes = {
  get DeviceDamlTransaction() {
    return (
      lookupProtobufType("com.daml.ledger.api.v2.interactive.DeviceDamlTransaction") ||
      (() => {
        throw new Error("DeviceDamlTransaction type not found in protobuf schema");
      })()
    );
  },
  get DeviceMetadata() {
    return (
      lookupProtobufType("com.daml.ledger.api.v2.interactive.DeviceMetadata") ||
      (() => {
        throw new Error("DeviceMetadata type not found in protobuf schema");
      })()
    );
  },
  get Node() {
    return (
      lookupProtobufType("com.daml.ledger.api.v2.interactive.DeviceDamlTransaction.Node") ||
      (() => {
        throw new Error("DeviceDamlTransaction.Node type not found in protobuf schema");
      })()
    );
  },
  get InputContract() {
    return (
      lookupProtobufType("com.daml.ledger.api.v2.interactive.DeviceMetadata.InputContract") ||
      (() => {
        throw new Error("DeviceMetadata.InputContract type not found in protobuf schema");
      })()
    );
  },
} as const;
