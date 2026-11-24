import { renderHook } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useAddressDisplayedViewModel } from "./useAddressDisplayedViewModel";

describe("useAddressDisplayedViewModel", () => {
  it("should resolve the copy from the receiveAddress keys", () => {
    const { result } = renderHook(() => useAddressDisplayedViewModel(), {
      wrapper: I18nTestProvider,
    });

    expect(result.current).toEqual({
      title: "receiveAddress.addressDisplayed.title",
      description: "receiveAddress.addressDisplayed.description",
    });
  });
});
