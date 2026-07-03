import type {
  EditAddressBookExternalAddressEvmIntentDefinition,
  EditAddressBookExternalAddressIdentifierEvmIntentDefinition,
  EditAddressBookExternalAddressScopeEvmIntentDefinition,
  RegisterAddressBookExternalAddressEvmIntentDefinition,
  RegisterAddressBookLedgerAccountEvmIntentDefinition,
  RenameAddressBookContactEvmIntentDefinition,
  RenameAddressBookLedgerAccountEvmIntentDefinition,
} from "./types";
import {
  editAddressBookExternalAddressEvmIntentJob,
  editAddressBookExternalAddressIdentifierEvmIntentJob,
  editAddressBookExternalAddressScopeEvmIntentJob,
  registerAddressBookExternalAddressEvmIntentJob,
  registerAddressBookLedgerAccountEvmIntentJob,
  renameAddressBookContactEvmIntentJob,
  renameAddressBookLedgerAccountEvmIntentJob,
} from "./job";

export const registerAddressBookExternalAddressEvmIntentDefinition: RegisterAddressBookExternalAddressEvmIntentDefinition =
  {
    delegateDeviceLockStateHandlingToExecutor: true,
    job: registerAddressBookExternalAddressEvmIntentJob,
    label: "Register EVM Address Book external address",
    requiresConnectedDevice: true,
  };

export const renameAddressBookContactEvmIntentDefinition: RenameAddressBookContactEvmIntentDefinition =
  {
    delegateDeviceLockStateHandlingToExecutor: true,
    job: renameAddressBookContactEvmIntentJob,
    label: "Rename EVM Address Book contact",
    requiresConnectedDevice: true,
  };

export const editAddressBookExternalAddressIdentifierEvmIntentDefinition: EditAddressBookExternalAddressIdentifierEvmIntentDefinition =
  {
    delegateDeviceLockStateHandlingToExecutor: true,
    job: editAddressBookExternalAddressIdentifierEvmIntentJob,
    label: "Edit EVM Address Book external address identifier",
    requiresConnectedDevice: true,
  };

export const editAddressBookExternalAddressScopeEvmIntentDefinition: EditAddressBookExternalAddressScopeEvmIntentDefinition =
  {
    delegateDeviceLockStateHandlingToExecutor: true,
    job: editAddressBookExternalAddressScopeEvmIntentJob,
    label: "Edit EVM Address Book external address scope",
    requiresConnectedDevice: true,
  };

export const editAddressBookExternalAddressEvmIntentDefinition: EditAddressBookExternalAddressEvmIntentDefinition =
  {
    delegateDeviceLockStateHandlingToExecutor: true,
    job: editAddressBookExternalAddressEvmIntentJob,
    label: "Edit EVM Address Book external address",
    requiresConnectedDevice: true,
  };

export const registerAddressBookLedgerAccountEvmIntentDefinition: RegisterAddressBookLedgerAccountEvmIntentDefinition =
  {
    delegateDeviceLockStateHandlingToExecutor: true,
    job: registerAddressBookLedgerAccountEvmIntentJob,
    label: "Register EVM Address Book Ledger account",
    requiresConnectedDevice: true,
  };

export const renameAddressBookLedgerAccountEvmIntentDefinition: RenameAddressBookLedgerAccountEvmIntentDefinition =
  {
    delegateDeviceLockStateHandlingToExecutor: true,
    job: renameAddressBookLedgerAccountEvmIntentJob,
    label: "Rename EVM Address Book Ledger account",
    requiresConnectedDevice: true,
  };
