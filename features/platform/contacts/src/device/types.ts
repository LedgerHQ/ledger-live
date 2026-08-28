import type { Intent, IntentPlatformDefinition } from "@features/platform-device-intent";
import type {
  ContactIntentResult,
  EditExternalAddressIntentInput,
  EditExternalAddressIntentPlatformDefinition,
  EditExternalAddressJobState,
  EditExternalAddressResult,
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressIntentPlatformDefinition,
  RegisterLedgerAccountIntentPlatformDefinition,
  RegisterExternalAddressJobState,
  RegisterExternalAddressResult,
  RenameContactIntentInput,
  RenameContactIntentPlatformDefinition,
  RenameContactJobState,
  RenameContactResult,
  RenameLedgerAccountIntentPlatformDefinition,
} from "./intents";

export type ContactsDeviceInitializationInput = Readonly<{
  appName: string;
  dependencies: string[];
  requireLatestFirmware: boolean;
}>;

export type ContactDeviceIntentJobState =
  | RegisterExternalAddressJobState
  | RenameContactJobState
  | EditExternalAddressJobState;

export type ContactDeviceIntentInput =
  | RegisterExternalAddressIntentInput
  | RenameContactIntentInput
  | EditExternalAddressIntentInput;

export type ContactDeviceIntentResult =
  | ContactIntentResult<RegisterExternalAddressResult>
  | ContactIntentResult<RenameContactResult>
  | ContactIntentResult<EditExternalAddressResult>;

export type ContactDeviceIntent = Intent<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined,
  ContactDeviceIntentResult
>;

/**
 * The platform definitions for the five Contacts device intents. Each app owns its
 * renderers, so it builds these from the shared `IntentDefinition`s and injects
 * them into {@link useContactsIntentsOrchestrator}.
 *
 * The first three keys mirror the {@link ContactDeviceIntentsPort} methods that
 * consume them. `registerLedgerAccount` and `renameLedgerAccount` have no port
 * method yet: the orchestrator accepts them so each app keeps one home for every
 * Contacts renderer, and will wire them when their operations land.
 */
export type ContactsIntentPlatformDefinitions = Readonly<{
  registerExternalAddress: RegisterExternalAddressIntentPlatformDefinition;
  renameExternalContact: RenameContactIntentPlatformDefinition;
  editExternalAddress: EditExternalAddressIntentPlatformDefinition;
  registerLedgerAccount: RegisterLedgerAccountIntentPlatformDefinition;
  renameLedgerAccount: RenameLedgerAccountIntentPlatformDefinition;
}>;

export type ContactOperation<JobState, Input, IntentResult, Result> = Readonly<{
  intentDefinition: IntentPlatformDefinition<JobState, Input, undefined, IntentResult>;
  intentInput: Input;
  initializationInput: ContactsDeviceInitializationInput;
  mapIntentResultToResult: (result: IntentResult) => Result;
}>;
