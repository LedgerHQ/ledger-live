import { renderHook } from "@testing-library/react-native";
import { CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME } from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useEditAddressLabels } from "./useEditAddressLabels";

describe("useEditAddressLabels", () => {
  it("keeps the mobile too-long key", () => {
    const { result } = renderHook(() => useEditAddressLabels(true), {
      wrapper: I18nTestProvider,
    });

    expect(result.current.labelValidationErrors[CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]).toBe(
      "contacts.addAddressName.labelTooLong",
    );
  });
});
