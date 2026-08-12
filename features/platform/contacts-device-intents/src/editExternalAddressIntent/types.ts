import type { BlockchainFamily, ChainId, ContactIdentifier, GroupHandle, Proof } from "../types";

export type EditExternalAddressStep = "identifier" | "scope";

export type EditExternalAddressIntentInput = {
  contactName: string;
  previousScope: string;
  newScope: string;
  previousAddress: ContactIdentifier;
  newAddress: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
};

export type EditExternalAddressResult = {
  appliedStep: EditExternalAddressStep;
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
};

export type EditExternalAddressJobState =
  | { type: "pending" }
  | {
      type: "awaiting-device-confirmation";
      step: EditExternalAddressStep;
    }
  | {
      type: "partial-result";
      result: EditExternalAddressResult;
    }
  | {
      type: "completed";
      appliedSteps: EditExternalAddressStep[];
      result: EditExternalAddressResult;
    }
  | {
      type: "failed";
      failedStep?: EditExternalAddressStep;
      error: Error;
    };
