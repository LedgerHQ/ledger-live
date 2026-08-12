import type {
  BlockchainFamily,
  ChainId,
  ContactIdentifier,
  GroupHandle,
  JobStateBase,
  Proof,
} from "../types";

export type RegisterExternalAddressIntentInput = {
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  existingContactGroup?: {
    groupHandle: GroupHandle;
    hmacProof: Proof;
  };
};

export type RegisterExternalAddressResult = {
  mode: "newContactGroup" | "existingContactGroup";
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
};

export type RegisterExternalAddressJobState =
  | JobStateBase
  | {
      type: "completed";
      result: RegisterExternalAddressResult;
    };
