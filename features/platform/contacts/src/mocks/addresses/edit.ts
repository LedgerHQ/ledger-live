import { contact } from "@domain/entity-contact";
import { mockContact } from "@domain/entity-contact/schema.mock";
import type { Contact, ContactId } from "@domain/entity-contact";
import type {
  AddressEditDraft,
  AddressEditInput,
  AddressEditPort,
  ConfirmedAddressEditResult,
  ContactDetailPort,
  ContactDetailState,
} from "../../contracts";

export function createMockAddressEditPort(
  contacts: Map<ContactId, Contact>,
  loadContactDetail: ContactDetailPort["loadContactDetail"],
): AddressEditPort {
  return {
    async prepareAddressEdit(input: AddressEditInput): Promise<AddressEditDraft> {
      return input;
    },
    async applyConfirmedAddressEdit(result: ConfirmedAddressEditResult): Promise<ContactDetailState> {
      const selectedContact =
        contacts.get(result.draft.contactId) ?? mockContact({ id: result.draft.contactId });
      const nextAddresses = selectedContact.addresses.map(address =>
        address.id === result.draft.addressId ? { ...address, label: result.draft.label } : address,
      );
      const nextContact = contact({
        ...selectedContact,
        addresses: nextAddresses,
      });

      contacts.set(nextContact.id, nextContact);

      return loadContactDetail(nextContact.id);
    },
  };
}
