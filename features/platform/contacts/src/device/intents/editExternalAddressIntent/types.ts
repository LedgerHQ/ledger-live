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

export type EditExternalAddressStep = "identifier" | "scope";

export type EditExternalAddressIntentInput = Readonly<{
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
}>;

export type EditExternalAddressResult = Readonly<{
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type EditExternalAddressJobState =
  | { readonly type: "pending" }
  | { readonly type: "awaiting-device-confirmation"; readonly step: EditExternalAddressStep }
  | { readonly type: "partial-result"; readonly result: EditExternalAddressResult }
  | {
      readonly type: "completed";
      readonly appliedSteps: readonly EditExternalAddressStep[];
      readonly result: EditExternalAddressResult;
    }
  | {
      readonly type: "failed";
      readonly failedStep?: EditExternalAddressStep;
      readonly partialResult?: EditExternalAddressResult;
      readonly error: Error;
    };

export type EditExternalAddressIntentDefinition = IntentDefinition<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput
>;

export type EditExternalAddressIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<EditExternalAddressJobState, EditExternalAddressIntentInput, ExtraProps>;

export type EditExternalAddressIntent<ExtraProps = undefined> = Intent<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ExtraProps
>;
