import type {
  BlockchainFamily,
  ChainId,
  ContactIdentifier,
  GroupHandle,
  JobStateBase,
  Proof,
} from "../types";

export type EditExternalAddressIdentifierIntentInput = {
  contactName: string;
  scope: string;
  previousAddress: ContactIdentifier;
  newAddress: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
};

export type EditExternalAddressIdentifierResult = {
  contactName: string;
  scope: string;
  previousAddress: ContactIdentifier;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
};

export type EditExternalAddressIdentifierJobState =
  | JobStateBase
  | {
      type: "completed";
      result: EditExternalAddressIdentifierResult;
    };
