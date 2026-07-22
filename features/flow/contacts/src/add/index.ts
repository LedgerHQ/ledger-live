export type { ContactCreationInput, ContactCreationPort } from "./ports";
export { CONTACT_NAME_MAX_LENGTH } from "./constants";
export type { AddContactViewModel } from "./types";
export { createAddContactViewModel } from "./viewModel";
export { createAddContactController, type AddContactController } from "./controller";
export { useAddContactDrawerViewModel } from "./useAddContactDrawerViewModel";
export type {
  AddContactDrawerViewModel,
  ContactsAddContactDrawerLabels,
  ContactsAddContactDrawerProps,
  UseAddContactDrawerViewModelOptions,
} from "./drawer.types";
