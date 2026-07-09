import type { Contact } from "@domain/entity-contact";
import type { ContactsPlatform, ContactsTrackingEvent } from "../contracts";

export type MockContactsPlatformOptions = Readonly<{
  contacts?: readonly Contact[];
  ledgerSyncEnabled?: boolean;
}>;

export type MockContactsPlatform = ContactsPlatform &
  Readonly<{
    trackedEvents: readonly ContactsTrackingEvent[];
  }>;
