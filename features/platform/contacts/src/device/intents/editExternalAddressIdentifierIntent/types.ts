import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";

type ContactIdentifier = string;
type ChainId = string | number;
type BlockchainFamily = string;
type GroupHandle = string;
type Proof = string;

export type EditExternalAddressIdentifierIntentInput = Readonly<{
  contactName: string;
  scope: string;
  previousAddress: ContactIdentifier;
  newAddress: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type EditExternalAddressIdentifierResult = Readonly<{
  contactName: string;
  scope: string;
  previousAddress: ContactIdentifier;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type EditExternalAddressIdentifierJobState =
  | { readonly type: "pending" }
  | { readonly type: "awaiting-device-confirmation" }
  | { readonly type: "completed"; readonly result: EditExternalAddressIdentifierResult }
  | { readonly type: "failed"; readonly error: Error };

export type EditExternalAddressIdentifierIntentDefinition = IntentDefinition<
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIdentifierIntentInput
>;

export type EditExternalAddressIdentifierIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    EditExternalAddressIdentifierJobState,
    EditExternalAddressIdentifierIntentInput,
    ExtraProps
  >;

export type EditExternalAddressIdentifierIntent<ExtraProps = undefined> = Intent<
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIdentifierIntentInput,
  ExtraProps
>;
