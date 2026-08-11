import { act, renderHook } from "@testing-library/react";
import { useContactsFeatureIntroductionActions } from "./useContactsFeatureIntroductionActions";

describe("useContactsFeatureIntroductionActions", () => {
  it("should call complete once and not defer when the introduction closes after completion", () => {
    const onComplete = jest.fn();
    const onDefer = jest.fn();
    const { result } = renderHook(() =>
      useContactsFeatureIntroductionActions({ isOpen: true, onComplete, onDefer }),
    );

    act(() => {
      result.current.complete();
      result.current.complete();
      result.current.onClose();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onDefer).not.toHaveBeenCalled();
  });

  it("should defer once and reset its actions when the introduction reopens", () => {
    const onComplete = jest.fn();
    const onDefer = jest.fn();
    const { result, rerender } = renderHook(
      ({ isOpen }) => useContactsFeatureIntroductionActions({ isOpen, onComplete, onDefer }),
      { initialProps: { isOpen: true } },
    );

    act(() => {
      result.current.defer();
      result.current.onClose();
    });
    expect(onDefer).toHaveBeenCalledTimes(1);

    rerender({ isOpen: false });
    rerender({ isOpen: true });
    act(() => {
      result.current.defer();
    });

    expect(onDefer).toHaveBeenCalledTimes(2);
  });
});
