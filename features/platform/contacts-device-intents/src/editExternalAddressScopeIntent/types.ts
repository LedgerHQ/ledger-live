import type {
  BlockchainFamily,
  ChainId,
  ContactIdentifier,
  GroupHandle,
  JobStateBase,
  Proof,
} from "../types";

export type EditExternalAddressScopeIntentInput = {
  contactName: string;
  previousScope: string;
  newScope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
};

export type EditExternalAddressScopeResult = {
  contactName: string;
  previousScope: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
};

export type EditExternalAddressScopeJobState =
  | JobStateBase
  | {
      type: "completed";
      result: EditExternalAddressScopeResult;
    };
