import type { ContactId } from "@domain/entity-contact";

export type AddAddressFlowState =
  | Readonly<{ status: "closed" }>
  | Readonly<{
      status: "selectingCurrency";
      selectedContactId: ContactId;
    }>;

export type AddAddressFlowViewModel = Readonly<{
  state: AddAddressFlowState;
  start: (contactId: ContactId) => void;
  close: () => void;
}>;
