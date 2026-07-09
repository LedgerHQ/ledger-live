import type { AddAddressPort, AddressEditPort } from "./address";
import type { ContactCreationPort } from "./contactCreation";
import type { ContactEditPort } from "./contactEdit";
import type { ContactDetailPort } from "./detail";
import type { LedgerSyncGatePort } from "./ledgerSyncGate";
import type { ContactsListPort } from "./list";
import type { ContactsTrackingPort } from "./tracking";

export type ContactsPlatform = Readonly<{
  list: ContactsListPort;
  detail: ContactDetailPort;
  create: ContactCreationPort;
  addAddress: AddAddressPort;
  editContact: ContactEditPort;
  editAddress: AddressEditPort;
  ledgerSyncGate: LedgerSyncGatePort;
  tracking: ContactsTrackingPort;
}>;
