export type { ContactCreationInput, ContactCreationPort } from "./model/ports";
export { CONTACT_NAME_MAX_LENGTH } from "./model/constants";
export type { AddContactViewModel } from "./model/types";
export { createAddContactViewModel } from "./model/viewModel";
export { createAddContactController, type AddContactController } from "./model/controller";
export { useAddContactViewModel } from "./useAddContactViewModel";
export type { UseAddContactViewModelResult } from "./useAddContactViewModel";
export { useAddContactDrawerViewModel } from "./useAddContactDrawerViewModel";
export type {
  AddContactDrawerViewModel,
  ContactsAddContactDialogLabels,
  ContactsAddContactDialogProps,
  ContactsAddContactDrawerLabels,
  ContactsAddContactDrawerProps,
  UseAddContactDrawerViewModelOptions,
} from "./types";
