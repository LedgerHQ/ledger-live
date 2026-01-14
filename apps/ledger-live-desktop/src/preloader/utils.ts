/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AccountAddress,
  BlockHash,
  CcdAmount,
  ContractAddress,
  ContractName,
  CredentialRegistrationId,
  DataBlob,
  Duration,
  Energy,
  EntrypointName,
  InitName,
  ModuleReference,
  Parameter,
  ReceiveName,
  ReturnValue,
  SequenceNumber,
  Timestamp,
  TokenAmount,
  TokenHolder,
  TokenId,
  TokenMetadataUrl,
  TokenModuleReference,
  TransactionExpiry,
  TransactionHash,
} from "@concordium/web-sdk";

const types: Record<any, string> = {
  BigInt: "bigint",
  Date: "date",
  AccountAddress: "accountAddress",
  BlockHash: "blockHash",
  CcdAmount: "ccdAmount",
  ContractAddress: "contractAddress",
  ContractName: "contractName",
  CredentialRegistrationId: "credentialRegistrationId",
  DataBlob: "dataBlob",
  Duration: "duration",
  Energy: "energy",
  EntrypointName: "entrypointName",
  InitName: "initName",
  ModuleReference: "moduleReference",
  Parameter: "parameter",
  ReceiveName: "receiveName",
  ReturnValue: "returnValue",
  SequenceNumber: "sequenceNumber",
  Timestamp: "timestamp",
  TransactionExpiry: "transactionExpiry",
  TransactionHash: "transactionHash",
  TokenModuleReference: "tokenModuleReference",
  TokenId: "tokenId",
  TokenMetadataUrl: "tokenMetadataUrl",
  TokenHolder: "tokenHolder",
  TokenAmount: "tokenAmount",
};

function replacer(this: any, key: string) {
  const value = this[key];

  if (typeof value === types.BigInt) {
    return { "@type": types.BigInt, value: value.toString() };
  }
  if (value instanceof Date) {
    return { "@type": types.Date, value: value.toJSON() };
  }

  // Handle concordium domain types
  // eslint-disable-next-line default-case
  switch (true) {
    case AccountAddress.instanceOf(value):
      return { "@type": types.AccountAddress, value: value.toJSON() };
    case BlockHash.instanceOf(value):
      return { "@type": types.BlockHash, value: value.toJSON() };
    case CcdAmount.instanceOf(value):
      return { "@type": types.CcdAmount, value: value.toJSON() };
    case ContractAddress.instanceOf(value):
      return {
        "@type": types.ContractAddress,
        value: ContractAddress.toSerializable(value),
      };
    case ContractName.instanceOf(value):
      return { "@type": types.ContractName, value: value.toJSON() };
    case CredentialRegistrationId.instanceOf(value):
      return {
        "@type": types.CredentialRegistrationId,
        value: value.toJSON(),
      };
    case value instanceof DataBlob:
      return { "@type": types.DataBlob, value: value.toJSON() };
    case Duration.instanceOf(value):
      return {
        "@type": types.Duration,
        value: Duration.toSerializable(value),
      };
    case Energy.instanceOf(value):
      return {
        "@type": types.Energy,
        value: Energy.toSerializable(value),
      };
    case EntrypointName.instanceOf(value):
      return { "@type": types.EntrypointName, value: value.toJSON() };
    case InitName.instanceOf(value):
      return { "@type": types.InitName, value: value.toJSON() };
    case ModuleReference.instanceOf(value):
      return { "@type": types.ModuleReference, value: value.toJSON() };
    case Parameter.instanceOf(value):
      return { "@type": types.Parameter, value: value.toJSON() };
    case ReceiveName.instanceOf(value):
      return { "@type": types.ReceiveName, value: value.toJSON() };
    case ReturnValue.instanceOf(value):
      return { "@type": types.ReturnValue, value: value.toJSON() };
    case SequenceNumber.instanceOf(value):
      return { "@type": types.SequenceNumber, value: value.toJSON() };
    case Timestamp.instanceOf(value):
      return {
        "@type": types.Timestamp,
        value: Timestamp.toSerializable(value),
      };
    case TransactionExpiry.instanceOf(value):
      return {
        "@type": types.TransactionExpiry,
        value: TransactionExpiry.toSerializable(value),
      };
    case TransactionHash.instanceOf(value):
      return { "@type": types.TransactionHash, value: value.toJSON() };
    case TokenId.instanceOf(value):
      return { "@type": types.TokenId, value: value.toJSON() };
    case TokenModuleReference.instanceOf(value):
      return {
        "@type": types.TokenModuleReference,
        value: value.toJSON(),
      };
    case TokenMetadataUrl.instanceOf(value):
      return {
        "@type": types.TokenMetadataUrl,
        value: value.toJSON(),
      };
    case TokenHolder.instanceOf(value):
      return {
        "@type": types.TokenHolder,
        value: value.toJSON(),
      };
    case TokenAmount.instanceOf(value):
      return {
        "@type": types.TokenAmount,
        value: value.toJSON(),
      };
  }
  return value;
}

export function stringify(input: any) {
  return JSON.stringify(input, replacer);
}

export function parse(input: string | undefined) {
  if (!input) {
    return undefined;
  }
  return JSON.parse(input, (_, v) => {
    if (v) {
      switch (v["@type"]) {
        case types.BigInt:
          return BigInt(v.value);
        case types.Date:
          return new Date(v.value);
        // concordium domain types
        case types.AccountAddress:
          return AccountAddress.fromJSON(v.value);
        case types.BlockHash:
          return BlockHash.fromJSON(v.value);
        case types.CcdAmount:
          return CcdAmount.fromJSON(v.value);
        case types.ContractAddress:
          return ContractAddress.fromSerializable(v.value);
        case types.ContractName:
          return ContractName.fromJSON(v.value);
        case types.CredentialRegistrationId:
          return CredentialRegistrationId.fromJSON(v.value);
        case types.DataBlob:
          return DataBlob.fromJSON(v.value);
        case types.Duration:
          return Duration.fromSerializable(v.value);
        case types.Energy:
          return Energy.fromSerializable(v.value);
        case types.EntrypointName:
          return EntrypointName.fromJSON(v.value);
        case types.InitName:
          return InitName.fromJSON(v.value);
        case types.ModuleReference:
          return ModuleReference.fromJSON(v.value);
        case types.Parameter:
          return Parameter.fromJSON(v.value);
        case types.ReceiveName:
          return ReceiveName.fromJSON(v.value);
        case types.ReturnValue:
          return ReturnValue.fromJSON(v.value);
        case types.SequenceNumber:
          return SequenceNumber.fromJSON(v.value);
        case types.Timestamp:
          return Timestamp.fromSerializable(v.value);
        case types.TransactionExpiry:
          return TransactionExpiry.fromSerializable(v.value);
        case types.TransactionHash:
          return TransactionHash.fromJSON(v.value);
        case types.TokenId:
          return TokenId.fromJSON(v.value);
        case types.TokenModuleReference:
          return TokenModuleReference.fromJSON(v.value);
        case types.TokenMetadataUrl:
          return TokenMetadataUrl.fromJSON(v.value);
        case types.TokenHolder:
          return TokenHolder.fromJSON(v.value);
        case types.TokenAmount:
          return TokenAmount.fromJSON(v.value);
        default:
          return v;
      }
    }
    return v;
  });
}

/**
 * Given a JSON string, changes the type of the entries with the given key from number to strings.
 * Can be used before parsing json with numbers, which can be larger than the MAX_SAFE_INTEGER
 * to avoid data-loss, from the automatic conversion to a number.
 * N.B. will only change fields that are actually numbers.
 * @param jsonStruct: A string that containts a JSON struct.x
 * @param key: the key of the key-value pair, which should be converted from a number to a string.
 */
export function intToString(jsonStruct: string, key: string) {
  return jsonStruct.replace(new RegExp(`"${key}":\\s*([0-9]+)`, "g"), `"${key}":"$1"`);
}
