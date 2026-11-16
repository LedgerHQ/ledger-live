import { act } from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import {
  useUnseededIntroKaraokeViewModel,
  type UnseededIntroKaraokeScreenProps,
} from "./useUnseededIntroKaraokeViewModel";

describe("useUnseededIntroKaraokeViewModel", () => {
  it("should resume the counterfeit warning after another sheet was on top", () => {
    const onFinish = jest.fn(() => true);
    let props: UnseededIntroKaraokeScreenProps = {
      deviceModelId: DeviceModelId.nanoX,
      onFinish,
      onClose: jest.fn(),
    };
    const { result, rerender } = renderHook(() => useUnseededIntroKaraokeViewModel(props), {
      overrideInitialState: withFlagOverrides({
        lwmOnboardingCounterfeitWarning: { enabled: true },
      }),
    });

    act(() => result.current.onAction());
    expect(result.current.counterfeitWarning?.isOpen).toBe(true);

    props = { ...props, suspendSheets: true };
    rerender(undefined as never);
    expect(result.current.counterfeitWarning?.isOpen).toBe(false);

    act(() => result.current.counterfeitWarning?.onDismiss());
    act(() => result.current.counterfeitWarning?.onProceed());

    props = { ...props, suspendSheets: false };
    rerender(undefined as never);
    expect(result.current.counterfeitWarning?.isOpen).toBe(true);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("should close the counterfeit warning when the user dismisses it", () => {
    const { result } = renderHook(
      () =>
        useUnseededIntroKaraokeViewModel({
          deviceModelId: DeviceModelId.nanoX,
          onFinish: jest.fn(),
          onClose: jest.fn(),
        }),
      {
        overrideInitialState: withFlagOverrides({
          lwmOnboardingCounterfeitWarning: { enabled: true },
        }),
      },
    );

    act(() => result.current.onAction());
    act(() => result.current.counterfeitWarning?.onDismiss());
    act(() => result.current.counterfeitWarning?.onProceed());

    expect(result.current.counterfeitWarning?.isOpen).toBe(false);
  });

  it("should finish once, and not after a dismiss", () => {
    const onFinish = jest.fn(() => true);
    const { result } = renderHook(
      () =>
        useUnseededIntroKaraokeViewModel({
          deviceModelId: DeviceModelId.nanoX,
          onFinish,
          onClose: jest.fn(),
        }),
      {
        overrideInitialState: withFlagOverrides({
          lwmOnboardingCounterfeitWarning: { enabled: true },
        }),
      },
    );

    act(() => result.current.onAction());
    act(() => result.current.counterfeitWarning?.onDismiss());
    act(() => result.current.counterfeitWarning?.onProceed());
    expect(onFinish).not.toHaveBeenCalled();

    act(() => result.current.onAction());
    const { onProceed } = result.current.counterfeitWarning ?? {};
    act(() => {
      onProceed?.();
      onProceed?.();
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("should finish once without a warning, and not while another sheet is on top", () => {
    const onFinish = jest.fn(() => true);
    let props: UnseededIntroKaraokeScreenProps = {
      deviceModelId: DeviceModelId.stax,
      suspendSheets: true,
      onFinish,
      onClose: jest.fn(),
    };
    const { result, rerender } = renderHook(() => useUnseededIntroKaraokeViewModel(props), {
      overrideInitialState: withFlagOverrides({
        lwmOnboardingCounterfeitWarning: { enabled: true },
      }),
    });

    act(() => result.current.onAction());
    expect(onFinish).not.toHaveBeenCalled();

    props = { ...props, suspendSheets: false };
    rerender(undefined as never);
    act(() => {
      result.current.onAction();
      result.current.onAction();
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("should let the user retry when the funnel did not take the step", () => {
    const onFinish = jest.fn().mockReturnValueOnce(false).mockReturnValue(true);
    const { result } = renderHook(
      () =>
        useUnseededIntroKaraokeViewModel({
          deviceModelId: DeviceModelId.stax,
          onFinish,
          onClose: jest.fn(),
        }),
      {
        overrideInitialState: withFlagOverrides({
          lwmOnboardingCounterfeitWarning: { enabled: false },
        }),
      },
    );

    act(() => result.current.onAction());
    act(() => result.current.onAction());
    act(() => result.current.onAction());

    expect(onFinish).toHaveBeenCalledTimes(2);
  });
});
