import type {
  DeviceIntentExecutorProps,
  Intent,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  EditExternalAddressIdentifierIntentInput,
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressScopeIntentInput,
  EditExternalAddressScopeJobState,
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressJobState,
  RenameContactIntentInput,
  RenameContactJobState,
} from "./intents";

export type ContactsDeviceInitializationInput = Readonly<{
  appName: string;
  dependencies: string[];
  requireLatestFirmware: boolean;
}>;

export type ContactDeviceIntentJobState =
  | RegisterExternalAddressJobState
  | RenameContactJobState
  | EditExternalAddressIdentifierJobState
  | EditExternalAddressScopeJobState
  | EditExternalAddressJobState;

export type ContactDeviceIntentInput =
  | RegisterExternalAddressIntentInput
  | RenameContactIntentInput
  | EditExternalAddressIdentifierIntentInput
  | EditExternalAddressScopeIntentInput
  | EditExternalAddressIntentInput;

export type ContactDeviceIntent = Intent<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined
>;

export type ContactsDeviceIntentExecutorProps = DeviceIntentExecutorProps<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined,
  ContactsDeviceInitializationInput
>;

export type ContactOperationOutcome<Result> =
  | { readonly type: "pending" }
  | { readonly type: "success"; readonly result: Result }
  | { readonly type: "failure"; readonly error: Error };

export type ContactOperation<JobState, Input, Result> = Readonly<{
  definition: IntentPlatformDefinition<JobState, Input, undefined>;
  input: Input;
  initializationInput: ContactsDeviceInitializationInput;
  classify: (state: JobState) => ContactOperationOutcome<Result>;
}>;

export type ContactOperationRequest<JobState, Input, Result> =
  | {
      readonly type: "intent";
      readonly operation: ContactOperation<JobState, Input, Result>;
    }
  | { readonly type: "immediate"; readonly result: Result };
