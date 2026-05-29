import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { act, renderHook } from "@testing-library/react-native";
import i18next from "i18next";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import {
  useCounterfeitWarningDrawerViewModel,
  type CounterfeitWarningDrawerContainerProps,
} from "../useCounterfeitWarningDrawerViewModel";
import { EVENT_CONCERN, EVENT_DISMISSED, EVENT_PROCEED, EVENT_SHOWN } from "../analytics";

const trackMock = jest.mocked(track);

const defaultProps: CounterfeitWarningDrawerContainerProps = {
  isOpen: true,
  deviceModelId: DeviceModelId.nanoX,
  onProceed: jest.fn(),
  onDismiss: jest.fn(),
};

const analyticsPayload = { deviceModelId: DeviceModelId.nanoX, flow: "Onboarding" };

describe("useCounterfeitWarningDrawerViewModel", () => {
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  it("should track shown once per open transition", () => {
    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useCounterfeitWarningDrawerViewModel({ ...defaultProps, isOpen }),
      { initialProps: { isOpen: true } },
    );

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith(EVENT_SHOWN, analyticsPayload);

    rerender({ isOpen: true });
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("should reset shown tracking when the drawer closes and reopens", () => {
    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useCounterfeitWarningDrawerViewModel({ ...defaultProps, isOpen }),
      { initialProps: { isOpen: true } },
    );
    expect(trackMock).toHaveBeenCalledTimes(1);

    rerender({ isOpen: false });
    expect(trackMock).toHaveBeenCalledTimes(1);

    rerender({ isOpen: true });
    expect(trackMock).toHaveBeenCalledTimes(2);
  });

  it("should not track shown when closed", () => {
    renderHook(() => useCounterfeitWarningDrawerViewModel({ ...defaultProps, isOpen: false }));

    expect(trackMock).not.toHaveBeenCalledWith(EVENT_SHOWN, expect.anything());
  });

  it("should resolve i18n labels from translation keys", () => {
    const { result } = renderHook(() => useCounterfeitWarningDrawerViewModel(defaultProps));

    expect(result.current.title).toBe(i18next.t("onboarding.counterfeitWarning.title"));
    expect(result.current.primaryCtaLabel).toBe(
      i18next.t("onboarding.counterfeitWarning.cta.primary"),
    );
    expect(result.current.secondaryCtaLabel).toBe(
      i18next.t("onboarding.counterfeitWarning.cta.secondary"),
    );
  });

  it("should track proceed and call onProceed", () => {
    const onProceed = jest.fn();
    const { result } = renderHook(() =>
      useCounterfeitWarningDrawerViewModel({ ...defaultProps, onProceed }),
    );

    act(() => {
      result.current.onProceed();
    });

    expect(trackMock).toHaveBeenCalledWith(EVENT_PROCEED, analyticsPayload);
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("should open the genuine check URL and track concern on secondary CTA", () => {
    const { result } = renderHook(() => useCounterfeitWarningDrawerViewModel(defaultProps));

    act(() => {
      result.current.onConcern();
    });

    expect(trackMock).toHaveBeenCalledWith(EVENT_CONCERN, analyticsPayload);
    expect(openURLSpy).toHaveBeenCalledWith(urls.genuineCheck.learnMore);
  });

  it("should open body links without analytics", () => {
    const { result } = renderHook(() => useCounterfeitWarningDrawerViewModel(defaultProps));

    act(() => {
      result.current.onLedgerComLink();
    });
    expect(openURLSpy).toHaveBeenCalledWith(urls.ledger);

    act(() => {
      result.current.onResellerLink();
    });
    expect(openURLSpy).toHaveBeenCalledWith(urls.ledgerReseller);
    expect(trackMock).not.toHaveBeenCalledWith(EVENT_CONCERN, expect.anything());
  });

  it("should track dismissed and call onDismiss", () => {
    const onDismiss = jest.fn();
    const { result } = renderHook(() =>
      useCounterfeitWarningDrawerViewModel({ ...defaultProps, onDismiss }),
    );

    act(() => {
      result.current.onDismiss();
    });

    expect(trackMock).toHaveBeenCalledWith(EVENT_DISMISSED, analyticsPayload);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
