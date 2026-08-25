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

export type RegisterExternalAddressIntentInput = Readonly<{
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  existingContactGroup?: Readonly<{ groupHandle: GroupHandle; hmacProof: Proof }>;
}>;

export type RegisterExternalAddressResult = Readonly<{
  mode: "newContactGroup" | "existingContactGroup";
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type RegisterExternalAddressJobState =
  | { readonly type: "pending" }
  | { readonly type: "awaiting-device-confirmation" }
  | { readonly type: "completed" }
  | { readonly type: "failed"; readonly error: Error };

export type RegisterExternalAddressIntentDefinition = IntentDefinition<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  ContactIntentResult<RegisterExternalAddressResult>
>;

export type RegisterExternalAddressIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    RegisterExternalAddressJobState,
    RegisterExternalAddressIntentInput,
    ExtraProps,
    ContactIntentResult<RegisterExternalAddressResult>
  >;

export type RegisterExternalAddressIntent<ExtraProps = undefined> = Intent<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  ExtraProps,
  ContactIntentResult<RegisterExternalAddressResult>
>;
