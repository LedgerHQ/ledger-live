import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { createMockAddAddressPort } from "./addresses/addAddress";
import { createMockAddressEditPort } from "./addresses/edit";
import { createMockContactCreationPort } from "./contacts/creation";
import { createMockContactDetailPort, createMockLoadContactDetail } from "./contacts/detail";
import { createMockContactEditPort } from "./contacts/edit";
import { createMockContactsListPort } from "./contacts/list";
import { createContactsMap } from "./contacts/state";
import { createMockLedgerSyncGatePort } from "./ledgerSyncGate";
import { createMockContactsTrackingPort } from "./tracking";
import type { ContactsTrackingEvent } from "../contracts";
import type { MockContactsPlatform, MockContactsPlatformOptions } from "./types";

export function createMockContactsPlatform(
  options: MockContactsPlatformOptions = {},
): MockContactsPlatform {
  const trackedEvents: ContactsTrackingEvent[] = [];
  const contacts = createContactsMap(options.contacts ?? mockPopulatedContacts());
  const loadContactDetail = createMockLoadContactDetail(contacts);

  return {
    trackedEvents,
    list: createMockContactsListPort(contacts),
    detail: createMockContactDetailPort(loadContactDetail),
    create: createMockContactCreationPort(contacts),
    addAddress: createMockAddAddressPort(contacts, loadContactDetail),
    editContact: createMockContactEditPort(contacts),
    editAddress: createMockAddressEditPort(contacts, loadContactDetail),
    ledgerSyncGate: createMockLedgerSyncGatePort(options.ledgerSyncEnabled ?? true),
    tracking: createMockContactsTrackingPort(trackedEvents),
  };
}
