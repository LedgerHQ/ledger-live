import type { Type } from "protobufjs";
import { ProtobufTypes, lookupProtobufType } from "./protobufRoot";

function getDeviceDamlTransactionType(): Type {
  return ProtobufTypes.DeviceDamlTransaction;
}

function getDeviceMetadataType(): Type {
  return ProtobufTypes.DeviceMetadata;
}

function getNodeType(): Type {
  return ProtobufTypes.Node;
}

function getInputContractType(): Type {
  return ProtobufTypes.InputContract;
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
  return lookupProtobufType(typeName);
}
