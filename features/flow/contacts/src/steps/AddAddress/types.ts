import type { ContactAddress, ContactId } from "@domain/entity-contact";

export type AddAddressFlowState =
  | Readonly<{ status: "closed" }>
  | Readonly<{
      status: "selectingCurrency";
      selectedContactId: ContactId;
    }>
  | Readonly<{
      status: "enteringAddress";
      selectedContactId: ContactId;
      selectedCurrencyId: ContactAddress["currencyId"];
    }>;

export type AddAddressFlowViewModel = Readonly<{
  state: AddAddressFlowState;
  start: (contactId: ContactId) => void;
  completeCurrencySelection: (
    contactId: ContactId,
    currencyId: ContactAddress["currencyId"],
  ) => void;
  close: () => void;
}>;
