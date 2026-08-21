import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { ContactIntentResult } from "../result";

type ContactIdentifier = string;
type ChainId = string | number;
type BlockchainFamily = string;
type GroupHandle = string;
type Proof = string;

export type EditExternalAddressScopeIntentInput = Readonly<{
  contactName: string;
  previousScope: string;
  newScope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type EditExternalAddressScopeResult = Readonly<{
  contactName: string;
  previousScope: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type EditExternalAddressScopeJobState =
  | { readonly type: "pending" }
  | { readonly type: "awaiting-device-confirmation" }
  | { readonly type: "completed" }
  | { readonly type: "failed"; readonly error: Error };

export type EditExternalAddressScopeIntentDefinition = IntentDefinition<
  EditExternalAddressScopeJobState,
  EditExternalAddressScopeIntentInput,
  ContactIntentResult<EditExternalAddressScopeResult>
>;

export type EditExternalAddressScopeIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    EditExternalAddressScopeJobState,
    EditExternalAddressScopeIntentInput,
    ExtraProps,
    ContactIntentResult<EditExternalAddressScopeResult>
  >;

export type EditExternalAddressScopeIntent<ExtraProps = undefined> = Intent<
  EditExternalAddressScopeJobState,
  EditExternalAddressScopeIntentInput,
  ExtraProps,
  ContactIntentResult<EditExternalAddressScopeResult>
>;
