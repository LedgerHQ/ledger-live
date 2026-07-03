import { AddressBookIntentComponent } from "../../components/AddressBookIntent";
import {
  editAddressBookExternalAddressEvmIntentDefinition,
  editAddressBookExternalAddressIdentifierEvmIntentDefinition,
  editAddressBookExternalAddressScopeEvmIntentDefinition,
  registerAddressBookExternalAddressEvmIntentDefinition,
  registerAddressBookLedgerAccountEvmIntentDefinition,
  renameAddressBookContactEvmIntentDefinition,
  renameAddressBookLedgerAccountEvmIntentDefinition,
} from "./intentDefinitions";
import type {
  EditAddressBookExternalAddressEvmIntentPlatformDefinition,
  EditAddressBookExternalAddressIdentifierEvmIntentPlatformDefinition,
  EditAddressBookExternalAddressScopeEvmIntentPlatformDefinition,
  RegisterAddressBookExternalAddressEvmIntentPlatformDefinition,
  RegisterAddressBookLedgerAccountEvmIntentPlatformDefinition,
  RenameAddressBookContactEvmIntentPlatformDefinition,
  RenameAddressBookLedgerAccountEvmIntentPlatformDefinition,
} from "./types";

export const registerAddressBookExternalAddressEvmIntentPlatformDefinition: RegisterAddressBookExternalAddressEvmIntentPlatformDefinition =
  {
    ...registerAddressBookExternalAddressEvmIntentDefinition,
    component: AddressBookIntentComponent,
  };

export const renameAddressBookContactEvmIntentPlatformDefinition: RenameAddressBookContactEvmIntentPlatformDefinition =
  {
    ...renameAddressBookContactEvmIntentDefinition,
    component: AddressBookIntentComponent,
  };

export const editAddressBookExternalAddressIdentifierEvmIntentPlatformDefinition: EditAddressBookExternalAddressIdentifierEvmIntentPlatformDefinition =
  {
    ...editAddressBookExternalAddressIdentifierEvmIntentDefinition,
    component: AddressBookIntentComponent,
  };

export const editAddressBookExternalAddressScopeEvmIntentPlatformDefinition: EditAddressBookExternalAddressScopeEvmIntentPlatformDefinition =
  {
    ...editAddressBookExternalAddressScopeEvmIntentDefinition,
    component: AddressBookIntentComponent,
  };

export const editAddressBookExternalAddressEvmIntentPlatformDefinition: EditAddressBookExternalAddressEvmIntentPlatformDefinition =
  {
    ...editAddressBookExternalAddressEvmIntentDefinition,
    component: AddressBookIntentComponent,
  };

export const registerAddressBookLedgerAccountEvmIntentPlatformDefinition: RegisterAddressBookLedgerAccountEvmIntentPlatformDefinition =
  {
    ...registerAddressBookLedgerAccountEvmIntentDefinition,
    component: AddressBookIntentComponent,
  };

export const renameAddressBookLedgerAccountEvmIntentPlatformDefinition: RenameAddressBookLedgerAccountEvmIntentPlatformDefinition =
  {
    ...renameAddressBookLedgerAccountEvmIntentDefinition,
    component: AddressBookIntentComponent,
  };
