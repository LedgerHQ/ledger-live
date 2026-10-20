import { renderHook } from "@testing-library/react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useEditAddressLabels } from "./useEditAddressLabels";

describe("useEditAddressLabels", () => {
  it("resolves the domain placeholder and the label validation keys", () => {
    const { result } = renderHook(() => useEditAddressLabels(true), {
      wrapper: I18nTestProvider,
    });

    expect(result.current.labelValidationErrors).toEqual({
      [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "contacts.editAddress.invalidLabelError",
      [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "contacts.addAddressName.duplicateLabel",
      [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: "contacts.addAddressName.tooLongLabel",
    });
    expect(result.current.addressValidation.addressPlaceholder).toBe(
      "contacts.addAddressEntry.addressPlaceholder",
    );
  });

  it("uses the address-only placeholder when the network does not support domains", () => {
    const { result } = renderHook(() => useEditAddressLabels(false), {
      wrapper: I18nTestProvider,
    });

    expect(result.current.addressValidation.addressPlaceholder).toBe(
      "contacts.addAddressEntry.addressPlaceholderNoENS",
    );
  });
});
