import { act, renderHook } from "@testing-library/react";
import { createContactsFeatureIntroductionPreferenceMock } from "./preference.mock";
import { useContactsFeatureIntroductionState } from "./useContactsFeatureIntroductionState";

describe("useContactsFeatureIntroductionState", () => {
  it("requests the introduction on a first visit when the entry is available", () => {
    const preference = createContactsFeatureIntroductionPreferenceMock(false);

    const { result } = renderHook(() =>
      useContactsFeatureIntroductionState({
        isContactsEntryAvailable: true,
        preference,
      }),
    );

    expect(result.current.isRequested).toBe(true);
  });

  it("stops requesting the introduction after dismissal", () => {
    const preference = createContactsFeatureIntroductionPreferenceMock(false);

    const { result, rerender } = renderHook(() =>
      useContactsFeatureIntroductionState({
        isContactsEntryAvailable: true,
        preference,
      }),
    );

    act(() => {
      result.current.dismiss();
    });
    rerender();

    expect(result.current.isRequested).toBe(false);
  });

  it("can reset the mocked preference to make the introduction eligible again", () => {
    const preference = createContactsFeatureIntroductionPreferenceMock(false);

    const { result, rerender } = renderHook(() =>
      useContactsFeatureIntroductionState({
        isContactsEntryAvailable: true,
        preference,
      }),
    );

    act(() => {
      result.current.dismiss();
    });
    rerender();
    expect(result.current.isRequested).toBe(false);

    act(() => {
      preference.reset();
    });
    rerender();

    expect(result.current.isRequested).toBe(true);
  });
});
