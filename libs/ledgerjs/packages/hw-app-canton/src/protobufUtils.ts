import * as protobuf from "protobufjs";
import type { Root, Type } from "protobufjs";
import transactionProtoJson from "./types/transaction-proto.json";

const root: Root = protobuf.Root.fromJSON(transactionProtoJson);

function getDeviceDamlTransactionType(): Type {
  return root.lookupType("com.daml.ledger.api.v2.interactive.DeviceDamlTransaction");
}

function getDeviceMetadataType(): Type {
  return root.lookupType("com.daml.ledger.api.v2.interactive.DeviceMetadata");
}

function getNodeType(): Type {
  return root.lookupType("com.daml.ledger.api.v2.interactive.DeviceDamlTransaction.Node");
}

function getInputContractType(): Type {
  return root.lookupType("com.daml.ledger.api.v2.interactive.DeviceMetadata.InputContract");
}

export function decodeDeviceDamlTransaction(data: Uint8Array): any {
  return getDeviceDamlTransactionType().decode(data);
}

export function decodeDeviceMetadata(data: Uint8Array): any {
  return getDeviceMetadataType().decode(data);
}

export function decodeNode(data: Uint8Array): any {
  return getNodeType().decode(data);
}

export function decodeInputContract(data: Uint8Array): any {
  return getInputContractType().decode(data);
}

export function lookupType(typeName: string): Type | null {
  return root.lookupType(typeName) || null;
}
