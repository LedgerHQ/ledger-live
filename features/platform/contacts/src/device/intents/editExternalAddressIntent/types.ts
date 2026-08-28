import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { ContactIntentResult } from "../resultReporter";

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
  | { readonly type: "partial-result" }
  | { readonly type: "completed" }
  | {
      readonly type: "failed";
      readonly failedStep?: EditExternalAddressStep;
      readonly error: Error;
    };

export type EditExternalAddressIntentDefinition = IntentDefinition<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ContactIntentResult<EditExternalAddressResult>
>;

export type EditExternalAddressIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    EditExternalAddressJobState,
    EditExternalAddressIntentInput,
    ExtraProps,
    ContactIntentResult<EditExternalAddressResult>
  >;

export type EditExternalAddressIntent<ExtraProps = undefined> = Intent<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ExtraProps,
  ContactIntentResult<EditExternalAddressResult>
>;
