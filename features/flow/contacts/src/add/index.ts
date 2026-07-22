export type { ContactCreationInput, ContactCreationPort } from "./model/ports";
export { CONTACT_NAME_MAX_LENGTH } from "./model/constants";
export type { AddContactViewModel } from "./model/types";
export { createAddContactViewModel } from "./model/viewModel";
export { createAddContactController, type AddContactController } from "./model/controller";
export { useAddContactDrawerViewModel } from "./drawer/useAddContactDrawerViewModel";
export type {
  AddContactDrawerViewModel,
  ContactsAddContactDrawerLabels,
  ContactsAddContactDrawerProps,
  UseAddContactDrawerViewModelOptions,
} from "./drawer/types";
