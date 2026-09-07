import type { DeviceIntentExecutorProps } from "@features/platform-device-intent";
import type { ContactsGetMinVersion } from "./contactsMinVersion";
import type {
  ContactDeviceIntentInput,
  ContactDeviceIntentJobState,
  ContactDeviceIntentResult,
  ContactsDeviceInitializationInput,
} from "./types";

/**
 * Structural match for each platform's `EnsureAppReadyUseCaseDependencies`
 * override, without importing that legacy `libs/*` type directly.
 */
export type ContactsInitializerConfig = Readonly<{
  dependencies?: Readonly<{
    getMinVersion?: ContactsGetMinVersion;
  }>;
}>;

export type ContactsDeviceIntentExecutorProps = DeviceIntentExecutorProps<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined,
  ContactsDeviceInitializationInput,
  ContactDeviceIntentResult
> & {
  initializerConfig?: ContactsInitializerConfig;
};
