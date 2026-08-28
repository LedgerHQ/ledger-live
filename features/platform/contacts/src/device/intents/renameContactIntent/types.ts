import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { ContactIntentResult } from "../resultReporter";

type GroupHandle = string;
type Proof = string;

export type RenameContactIntentInput = Readonly<{
  previousContactName: string;
  newContactName: string;
  groupHandle: GroupHandle;
  hmacProof: Proof;
}>;

export type RenameContactResult = Readonly<{
  previousContactName: string;
  contactName: string;
  groupHandle: GroupHandle;
  hmacProof: Proof;
}>;

export type RenameContactJobState =
  | { readonly type: "pending" }
  | { readonly type: "awaiting-device-confirmation" }
  | { readonly type: "completed" }
  | { readonly type: "failed"; readonly error: Error };

export type RenameContactIntentDefinition = IntentDefinition<
  RenameContactJobState,
  RenameContactIntentInput,
  ContactIntentResult<RenameContactResult>
>;

export type RenameContactIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    RenameContactJobState,
    RenameContactIntentInput,
    ExtraProps,
    ContactIntentResult<RenameContactResult>
  >;

export type RenameContactIntent<ExtraProps = undefined> = Intent<
  RenameContactJobState,
  RenameContactIntentInput,
  ExtraProps,
  ContactIntentResult<RenameContactResult>
>;
