import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { resolveContactAddressDetailActionsLabels } from "./resolveContactAddressDetailActionsLabels";

describe("resolveContactAddressDetailActionsLabels", () => {
  it("maps translation keys to address detail action labels", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactAddressDetailActionsLabels({ t });

    expect(labels.delete.title).toBe("contacts.deleteAddress.title");
    expect(labels.rename.labelValidationErrors).toEqual({
      [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "contacts.editAddress.invalidLabelError",
      [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "contacts.addAddressName.duplicateLabel",
      [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: "contacts.addAddressName.tooLongLabel",
    });
    expect(labels.rename.addressValidation.addressPlaceholder).toBe(
      "contacts.addAddressEntry.addressPlaceholder",
    );
    expect(labels.signerMismatch.title).toBe("contacts.editSignerMismatch.title");
  });

  it("allows overriding the address label too long translation key", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactAddressDetailActionsLabels({
      t,
      addressLabelTooLongKey: "contacts.addAddressName.labelTooLong",
    });

    expect(labels.rename.labelValidationErrors[CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]).toBe(
      "contacts.addAddressName.labelTooLong",
    );
  });
});
