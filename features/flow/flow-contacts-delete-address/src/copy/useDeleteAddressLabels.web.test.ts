import { renderHook } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useDeleteAddressLabels } from "./useDeleteAddressLabels";

describe("useDeleteAddressLabels", () => {
  it("resolves the confirmation copy", () => {
    const { result } = renderHook(() => useDeleteAddressLabels(), {
      wrapper: I18nTestProvider,
    });

    expect(result.current).toEqual({
      title: "contacts.deleteAddress.title",
      description: "contacts.deleteAddress.description",
      confirm: "contacts.deleteAddress.confirm",
      cancel: "contacts.deleteAddress.cancel",
    });
  });
});
