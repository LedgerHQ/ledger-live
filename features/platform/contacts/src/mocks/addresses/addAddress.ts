import { contact, contactAddress, ContactAddressIdSchema } from "@domain/entity-contact";
import { mockContact } from "@domain/entity-contact/schema.mock";
import type { Contact, ContactId } from "@domain/entity-contact";
import type {
  AddAddressPort,
  AddressCandidateInput,
  AddressCandidateValidation,
  AddressRegistrationDraft,
  ConfirmedAddressRegistrationResult,
  ContactDetailPort,
  ContactDetailState,
  ValidAddressCandidate,
} from "../../contracts";
import { createUniqueMockId } from "../ids";
import {
  isSupportedAddressCurrencyId,
  SUPPORTED_ADDRESS_CURRENCY_IDS,
} from "./supportedCurrencies";
import { isValidAddressLabel, isValidAddressValue } from "./validation";

export function createMockAddAddressPort(
  contacts: Map<ContactId, Contact>,
  loadContactDetail: ContactDetailPort["loadContactDetail"],
): AddAddressPort {
  return {
    async loadSupportedAddressCurrencyIds(_contactId: ContactId) {
      return SUPPORTED_ADDRESS_CURRENCY_IDS;
    },
    async validateAddressCandidate(
      input: AddressCandidateInput,
    ): Promise<AddressCandidateValidation> {
      if (!isSupportedAddressCurrencyId(input.currencyId)) {
        return { type: "invalid", reason: "unsupported-currency" };
      }

      if (!isValidAddressValue(input.address)) {
        return { type: "invalid", reason: "invalid-address-format" };
      }

      if (!isValidAddressLabel(input.label)) {
        return { type: "invalid", reason: "invalid-label" };
      }

      try {
        const address = contactAddress({
          id: ContactAddressIdSchema.parse(
            createUniqueMockId(
              "address",
              `${input.currencyId}-${input.address}`,
              contacts.get(input.contactId)?.addresses.map(address => address.id) ?? [],
            ),
          ),
          currencyId: input.currencyId,
          label: input.label,
          address: input.address.trim(),
        });

        return {
          type: "valid",
          candidate: {
            contactId: input.contactId,
            address,
          },
        };
      } catch {
        return { type: "invalid", reason: "invalid-address-format" };
      }
    },
    async prepareAddressRegistration(
      candidate: ValidAddressCandidate,
    ): Promise<AddressRegistrationDraft> {
      return {
        contactId: candidate.contactId,
        address: candidate.address,
      };
    },
    async applyConfirmedAddressRegistration(
      result: ConfirmedAddressRegistrationResult,
    ): Promise<ContactDetailState> {
      const selectedContact =
        contacts.get(result.draft.contactId) ?? mockContact({ id: result.draft.contactId });
      const nextAddress = contactAddress(result.draft.address);
      const nextContact = contact({
        ...selectedContact,
        addresses: [...selectedContact.addresses, nextAddress],
      });

      contacts.set(nextContact.id, nextContact);

      return loadContactDetail(nextContact.id);
    },
  };
}
