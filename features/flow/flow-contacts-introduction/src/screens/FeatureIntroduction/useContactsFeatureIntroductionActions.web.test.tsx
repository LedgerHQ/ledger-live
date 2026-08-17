import { act, renderHook } from "@testing-library/react";
import { useContactsFeatureIntroductionActions } from "./useContactsFeatureIntroductionActions";

describe("useContactsFeatureIntroductionActions", () => {
  it("should call complete once and not close when the introduction closes after completion", () => {
    const onComplete = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useContactsFeatureIntroductionActions({ isOpen: true, onComplete, onClose }),
    );

    act(() => {
      result.current.complete();
      result.current.complete();
      result.current.onClose();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should close once and reset its actions when the introduction reopens", () => {
    const onComplete = jest.fn();
    const onClose = jest.fn();
    const { result, rerender } = renderHook(
      ({ isOpen }) => useContactsFeatureIntroductionActions({ isOpen, onComplete, onClose }),
      { initialProps: { isOpen: true } },
    );

    act(() => {
      result.current.onClose();
      result.current.onClose();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender({ isOpen: false });
    rerender({ isOpen: true });
    act(() => {
      result.current.onClose();
    });

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
